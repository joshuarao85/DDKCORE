const sodium = require('sodium-javascript');
const BUFFER = require('../helpers/buffer.js');

const crypto = require('crypto');
const bignum = require('../helpers/bignum.js');
const constants = require('../helpers/constants.js');
const { transactionSortFunc } = require('src/helpers/transaction.utils');

const __private = {};

const BLOCK_BUFFER_SIZE
    = BUFFER.LENGTH.UINT32 // version
    + BUFFER.LENGTH.UINT32 // timestamp
    + BUFFER.LENGTH.DOUBLE_HEX // previousBlock
    + BUFFER.LENGTH.UINT32 // numberOfTransactions
    + BUFFER.LENGTH.INT64 // totalAmount
    + BUFFER.LENGTH.INT64 // totalFee
    + BUFFER.LENGTH.UINT32 // payloadLength
    + BUFFER.LENGTH.HEX // payloadHash
    + BUFFER.LENGTH.HEX // generatorPublicKey
;

/**
 * Main Block logic.
 * @memberof module:blocks
 * @class
 * @classdesc Main Block logic.
 * @param {Object} ed
 * @param {ZSchema} schema
 * @param {Transaction} transaction
 * @param {function} cb - Callback function.
 * @return {setImmediateCallback} With `this` as data.
 */
// Constructor
function Block(ed, schema, transaction, cb) {
    this.scope = {
        ed,
        schema,
        transaction,
    };
    if (cb) {
        return setImmediate(cb, null, this);
    }
}

/**
 * Gets address by public
 * @private
 * @implements {crypto.createHash}
 * @implements {bignum.fromBuffer}
 * @param {publicKey} publicKey
 * @return {address} address
 */
__private.getAddressByPublicKey = function (publicKey) {
    const publicKeyHash = crypto.createHash('sha256').update(publicKey, 'hex').digest();
    const temp = Buffer.alloc(BUFFER.LENGTH.INT64);

    for (let i = 0; i < 8; i++) {
        temp[i] = publicKeyHash[7 - i];
    }

    const address = `DDK${bignum.fromBuffer(temp).toString()}`;
    return address;
};

// Public methods
/**
 * Sorts input data transactions.
 * Calculates reward based on previous block data.
 * Generates new block.
 * @implements {BlockReward.calcReward}
 * @implements {crypto.createHash}
 * @implements {scope.transaction.getBytes}
 * @implements {Block.sign}
 * @implements {Block.objectNormalize}
 * @param {Object} data
 * @returns {block} block
 */
Block.prototype.create = function (data) {
    const transactions = data.transactions.sort(transactionSortFunc);

    let reward = 0, // changes from: __private.blockReward.calcReward(nextHeight)
        totalFee = 0,
        totalAmount = 0,
        size = 0;

    const blockTransactions = [];
    const payloadHash = crypto.createHash('sha256');

    for (let i = 0; i < transactions.length; i++) {
        const transaction = transactions[i];
        const bytes = this.scope.transaction.getBytes(transaction);

        if (size + bytes.length > constants.maxPayloadLength) {
            break;
        }

        size += bytes.length;

        totalFee += transaction.fee;
        totalAmount += transaction.amount;

        blockTransactions.push(transaction);
        payloadHash.update(bytes);
    }

    let block = {
        version: constants.CURRENT_BLOCK_VERSION,
        totalAmount,
        totalFee,
        reward,
        payloadHash: payloadHash.digest().toString('hex'),
        timestamp: data.timestamp,
        numberOfTransactions: blockTransactions.length,
        payloadLength: size,
        previousBlock: data.previousBlock.id,
        generatorPublicKey: data.keypair.publicKey.toString('hex'),
        transactions: blockTransactions
    };
    try {
        block.blockSignature = this.sign(block, data.keypair);

        block = this.objectNormalize(block);
    } catch (e) {
        throw e;
    }

    return block;
};

/**
 * Creates a block signature.
 * @implements {Block.getHash}
 * @implements {scope.ed.sign}
 * @param {block} block
 * @param {Object} keypair
 * @returns {signature} block signature
 */
Block.prototype.sign = function (block, keyPair) {
    const blockHash = this.getHash(block);
    const sig = Buffer.alloc(sodium.crypto_sign_BYTES);

    sodium.crypto_sign_detached(sig, blockHash, keyPair.privateKey);
    return sig.toString('hex');
};

/**
 * @implements {ByteBuffer}
 * @implements {bignum}
 * @param {block} block
 * @return {!Array} Contents as an ArrayBuffer
 * @throws {error} If buffer fails
 */
Block.prototype.getBytes = function (block) {
    const buf = Buffer.alloc(BLOCK_BUFFER_SIZE);
    let offset = 0;

    offset = BUFFER.writeInt32LE(buf, block.version, offset);
    offset = BUFFER.writeInt32LE(buf, block.timestamp, offset);

    if (block.previousBlock) {
        buf.write(block.previousBlock, offset, BUFFER.LENGTH.DOUBLE_HEX);
    }
    offset += BUFFER.LENGTH.DOUBLE_HEX;

    offset = BUFFER.writeInt32LE(buf, block.numberOfTransactions, offset);
    offset = BUFFER.writeUInt64LE(buf, block.totalAmount, offset);
    offset = BUFFER.writeUInt64LE(buf, block.totalFee, offset);
    offset = BUFFER.writeInt32LE(buf, block.payloadLength, offset);

    buf.write(block.payloadHash, offset, BUFFER.LENGTH.HEX, 'hex');
    offset += BUFFER.LENGTH.HEX;

    buf.write(block.generatorPublicKey, offset, BUFFER.LENGTH.HEX, 'hex');

    return buf;
};

/**
 * Verifies block hash, generator block publicKey and block signature.
 * @implements {Block.getBytes}
 * @implements {crypto.createHash}
 * @implements {scope.ed.verify}
 * @param {block} block
 * @return {boolean} verified hash, signature and publicKey
 * @throws {error} catch error
 */
Block.prototype.verifySignature = function (block) {
    const hash = crypto.createHash('sha256').update(this.getBytes(block)).digest();
    const blockSignatureBuffer = Buffer.from(block.blockSignature, 'hex');
    const generatorPublicKeyBuffer = Buffer.from(block.generatorPublicKey, 'hex');
    return sodium.crypto_sign_verify_detached(blockSignatureBuffer, hash, generatorPublicKeyBuffer);
};

Block.prototype.dbTable = 'blocks';

Block.prototype.dbFields = [
    'id',
    'version',
    'timestamp',
    'height',
    'previousBlock',
    'numberOfTransactions',
    'totalAmount',
    'totalFee',
    'reward',
    'payloadLength',
    'payloadHash',
    'generatorPublicKey',
    'blockSignature'
];

/**
 * Creates db object transaction to `blocks` table.
 * @param {block} block
 * @return {Object} created object {table, fields, values}
 * @throws {error} catch error
 */
Block.prototype.dbSave = function (block) {
    let payloadHash,
        generatorPublicKey,
        blockSignature;

    try {
        payloadHash = block.payloadHash;
        generatorPublicKey = block.generatorPublicKey;
        blockSignature = block.blockSignature;
    } catch (e) {
        throw e;
    }

    return {
        table: this.dbTable,
        fields: this.dbFields,
        values: {
            id: block.id,
            version: block.version,
            timestamp: block.timestamp,
            height: block.height,
            previousBlock: block.previousBlock || null,
            numberOfTransactions: block.numberOfTransactions,
            totalAmount: block.totalAmount,
            totalFee: block.totalFee,
            reward: block.reward || 0,
            payloadLength: block.payloadLength,
            payloadHash,
            generatorPublicKey,
            blockSignature
        }
    };
};

/**
 * @typedef {Object} block
 * @property {string} id - Between 1 and 20 chars
 * @property {number} height
 * @property {signature} blockSignature
 * @property {publicKey} generatorPublicKey
 * @property {number} numberOfTransactions
 * @property {hash} payloadHash
 * @property {number} payloadLength
 * @property {string} previousBlock - Between 1 and 20 chars
 * @property {number} timestamp
 * @property {number} totalAmount - Minimun 0
 * @property {number} totalFee - Minimun 0
 * @property {number} reward - Minimun 0
 * @property {Array} transactions - Unique items
 * @property {number} version - Minimun 0
 */
Block.prototype.schema = {
    id: 'Block',
    type: 'object',
    properties: {
        id: {
            type: 'string',
            format: 'hex',
            minLength: 1,
            maxLength: 64
        },
        height: {
            type: 'integer'
        },
        blockSignature: {
            type: 'string',
            format: 'signature'
        },
        generatorPublicKey: {
            type: 'string',
            format: 'publicKey'
        },
        numberOfTransactions: {
            type: 'integer'
        },
        payloadHash: {
            type: 'string',
            format: 'hex'
        },
        payloadLength: {
            type: 'integer'
        },
        previousBlock: {
            type: 'string',
            format: 'hex',
            minLength: 1,
            maxLength: 64
        },
        timestamp: {
            type: 'integer'
        },
        totalAmount: {
            type: 'integer',
            minimum: 0
        },
        totalFee: {
            type: 'integer',
            minimum: 0
        },
        reward: {
            type: 'integer',
            minimum: 0
        },
        transactions: {
            type: 'array',
            uniqueItems: true
        },
        version: {
            type: 'integer',
            minimum: 0
        }
    },
    required: ['blockSignature', 'generatorPublicKey', 'numberOfTransactions', 'payloadHash', 'payloadLength', 'timestamp', 'totalAmount', 'totalFee', 'reward', 'transactions', 'version']
};

/**
 * @implements {scope.schema.validate}
 * @implements {scope.transaction.objectNormalize}
 * @param {block} block
 * @return {error|transaction} error string | block normalized
 * @throws {string|error} error message | catch error
 */
Block.prototype.objectNormalize = function (block) {
    let i;

    for (i in block) {
        if (block[i] === null || typeof block[i] === 'undefined') {
            delete block[i];
        }
    }

    const report = this.scope.schema.validate(block, Block.prototype.schema);

    if (!report) {
        throw `Failed to validate block schema: ${this.scope.schema.getLastErrors().map(err => err.message).join(', ')}`;
    }

    try {
        for (i = 0; i < block.transactions.length; i++) {
            block.transactions[i] = this.scope.transaction.objectNormalize(block.transactions[i]);
        }
    } catch (e) {
        throw e;
    }

    return block;
};

/**
 * Calculates block id based on block.
 * @implements {crypto.createHash}
 * @implements {Block.getBytes}
 * @implements {bignum.fromBuffer}
 * @param {block} block
 * @return {string} id string
 */
Block.prototype.getId = function (block) {
    return crypto.createHash('sha256').update(this.getBytes(block)).digest('hex');
};

/**
 * Creates hash based on block bytes.
 * @implements {Block.getBytes}
 * @implements {crypto.createHash}
 * @param {block} block
 * @return {hash} sha256 crypto hash
 */
Block.prototype.getHash = function (block) {
    return crypto.createHash('sha256').update(this.getBytes(block)).digest();
};

/**
 * Returns send fees from constants.
 * @param {block} block
 * @return {number} fee
 * @todo delete unused input parameter
 */
Block.prototype.calculateFee = function () {
    return constants.fees.send;
};

/**
 * Creates block object based on raw data.
 * @implements {bignum}
 * @param {Object} raw
 * @return {null|block} blcok object
 */
Block.prototype.dbRead = function (raw) {
    if (!raw.b_id) {
        return null;
    }
    const block = {
        id: raw.b_id,
        version: parseInt(raw.b_version),
        timestamp: parseInt(raw.b_timestamp),
        height: parseInt(raw.b_height),
        previousBlock: raw.b_previousBlock,
        numberOfTransactions: parseInt(raw.b_numberOfTransactions),
        totalAmount: parseInt(raw.b_totalAmount),
        totalFee: parseInt(raw.b_totalFee),
        reward: parseInt(raw.b_reward),
        payloadLength: parseInt(raw.b_payloadLength),
        payloadHash: raw.b_payloadHash,
        generatorPublicKey: raw.b_generatorPublicKey,
        generatorId: __private.getAddressByPublicKey(raw.b_generatorPublicKey),
        blockSignature: raw.b_blockSignature,
        confirmations: parseInt(raw.b_confirmations),
        username: raw.m_username
    };
    block.totalForged = new bignum(block.totalFee).plus(new bignum(block.reward)).toString();
    return block;
};

// Export
module.exports = Block;
