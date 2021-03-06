const BlockReward = require('../../logic/blockReward.js');
const constants = require('../../helpers/constants.js');
const OrderBy = require('../../helpers/orderBy.js');
const schema = require('../../schema/blocks.js');
const sql = require('../../sql/blocks.js');

let modules;
let library;
let self;
const __private = {};

__private.blockReward = new BlockReward();

/**
 * Initializes library.
 * @memberof module:blocks
 * @class
 * @classdesc Main API logic.
 * Allows get information.
 * @param {Object} logger
 * @param {Database} db
 * @param {Block} block
 * @param {ZSchema} schema
 * @param {Sequence} dbSequence
 */
function API(logger, db, block, Schema, dbSequence) {
    library = {
        logger,
        db,
        schema: Schema,
        dbSequence,
        logic: {
            block,
        },
    };
    self = this;

    library.logger.trace('Blocks->API: Submodule initialized.');
    return self;
}

/**
 * Get block by ID
 *
 * @private
 * @async
 * @method getById
 * @param  {string}   id Block ID
 * @param  {Function} cb Callback function
 * @return {Function} cb Callback function from params (through setImmediate)
 * @return {Object}   cb.err Error if occurred
 * @return {Object}   cb.block Block object
 */
__private.getById = function (id, cb) {
    library.db.query(sql.getById, { id })
        .then((rows) => {
            if (!rows.length) {
                return setImmediate(cb, 'Block not found');
            }

            // Normalize block
            const block = library.logic.block.dbRead(rows[0]);

            return setImmediate(cb, null, block);
        })
        .catch((err) => {
            library.logger.error(err.stack);
            return setImmediate(cb, 'Blocks#getById error');
        });
};

/**
 * Get filtered list of blocks (without transactions)
 *
 * @private
 * @async
 * @method list
 * @param  {Object}   filter Conditions to filter with
 * @param  {string}   filter.generatorPublicKey Public key of delegate who generates the block
 * @param  {number}   filter.numberOfTransactions Number of transactions
 * @param  {string}   filter.previousBlock Previous block ID
 * @param  {number}   filter.height Block height
 * @param  {number}   filter.totalAmount Total amount of block's transactions
 * @param  {number}   filter.totalFee Block total fees
 * @param  {number}   filter.reward Block reward
 * @param  {number}   filter.limit Limit of blocks to retrieve, default: 100, max: 100
 * @param  {number}   filter.offset Offset from where to start
 * @param  {string}   filter.orderBy Sort order, default: height:desc
 * @param  {Function} cb Callback function
 * @return {Function} cb Callback function from params (through setImmediate)
 * @return {Object}   cb.err Error if occurred
 * @return {Object}   cb.data List of normalized blocks
 */
__private.list = function (filter, cb) {
    const params = {};
    const where = [];

    if (filter.generatorPublicKey) {
        where.push('"b_generatorPublicKey"::bytea = ${generatorPublicKey}');
        params.generatorPublicKey = filter.generatorPublicKey;
    }

    // FIXME: Useless condition
    if (filter.numberOfTransactions) {
        where.push('"b_numberOfTransactions" = ${numberOfTransactions}');
        params.numberOfTransactions = filter.numberOfTransactions;
    }

    if (filter.previousBlock) {
        where.push('"b_previousBlock" = ${previousBlock}');
        params.previousBlock = filter.previousBlock;
    }

    if (filter.height === 0 || filter.height > 0) {
        where.push('"b_height" = ${height}');
        params.height = filter.height;
    }

    // FIXME: Useless condition
    if (filter.totalAmount >= 0) {
        where.push('"b_totalAmount" = ${totalAmount}');
        params.totalAmount = filter.totalAmount;
    }

    // FIXME: Useless condition
    if (filter.totalFee >= 0) {
        where.push('"b_totalFee" = ${totalFee}');
        params.totalFee = filter.totalFee;
    }

    // FIXME: Useless condition
    if (filter.reward >= 0) {
        where.push('"b_reward" = ${reward}');
        params.reward = filter.reward;
    }

    if (!filter.limit) {
        params.limit = 100;
    } else {
        params.limit = Math.abs(filter.limit);
    }

    if (!filter.offset) {
        params.offset = 0;
    } else {
        params.offset = Math.abs(filter.offset);
    }

    if (params.limit > 100) {
        return setImmediate(cb, 'Invalid limit. Maximum is 100');
    }

    const orderBy = OrderBy(
        (filter.orderBy || 'height:desc'), {
            sortFields: sql.sortFields,
            fieldPrefix: 'b_'
        }
    );

    if (orderBy.error) {
        return setImmediate(cb, orderBy.error);
    }

    library.db.query(sql.countList({
        where
    }), params)
        .then((rows) => {
            const count = rows[0].count;

            library.db.query(sql.list({
                where,
                sortField: orderBy.sortField,
                sortMethod: orderBy.sortMethod
            }), params)
                .then((rowsList) => {
                    const blocks = [];

                    // Normalize blocks
                    for (let i = 0; i < rowsList.length; i++) {
                        // FIXME: Can have poor performance because it performs SHA256 hash calculation for each block
                        blocks.push(library.logic.block.dbRead(rowsList[i]));
                    }

                    const data = {
                        blocks,
                        count
                    };

                    return setImmediate(cb, null, data);
                })
                .catch((err) => {
                    library.logger.error(err.stack);
                    return setImmediate(cb, 'Blocks#list error');
                });
        })
        .catch((err) => {
            library.logger.error(err.stack);
            return setImmediate(cb, 'Blocks#list error');
        });
};


API.prototype.getBlock = function (req, cb) {
    if (!__private.loaded) {
        return setImmediate(cb, 'Blockchain is loading');
    }

    library.schema.validate(req.body, schema.getBlock, (err) => {
        if (err) {
            return setImmediate(cb, err[0].message);
        }

        library.dbSequence.add((cbAdd) => {
            __private.getById(req.body.id, (getByIdError, block) => {
                if (!block || getByIdError) {
                    return setImmediate(cbAdd, 'Block not found');
                }
                return setImmediate(cbAdd, null, { block });
            });
        }, cb);
    });
};

API.prototype.getBlocks = function (req, cb) {
    if (!__private.loaded) {
        return setImmediate(cb, 'Blockchain is loading');
    }

    library.schema.validate(req.body, schema.getBlocks, (err) => {
        if (err) {
            return setImmediate(cb, err[0].message);
        }

        library.dbSequence.add((cbAdd) => {
            __private.list(req.body, (errAdd, data) => {
                if (errAdd) {
                    return setImmediate(cbAdd, errAdd);
                }
                return setImmediate(cbAdd, null, { blocks: data.blocks, count: data.count });
            });
        }, cb);
    });
};

API.prototype.getBroadhash = function (req, cb) {
    if (!__private.loaded) {
        return setImmediate(cb, 'Blockchain is loading');
    }

    return setImmediate(cb, null, { broadhash: modules.system.getBroadhash() });
};

API.prototype.getEpoch = function (req, cb) {
    if (!__private.loaded) {
        return setImmediate(cb, 'Blockchain is loading');
    }

    return setImmediate(cb, null, { epoch: constants.epochTime });
};

API.prototype.getHeight = function (req, cb) {
    if (!__private.loaded) {
        return setImmediate(cb, 'Blockchain is loading');
    }

    return setImmediate(cb, null, { height: modules.blocks.lastBlock.get().height });
};

API.prototype.getFee = function (req, cb) {
    if (!__private.loaded) {
        return setImmediate(cb, 'Blockchain is loading');
    }

    return setImmediate(cb, null, { fee: library.logic.block.calculateFee() });
};

API.prototype.getFees = function (req, cb) {
    if (!__private.loaded) {
        return setImmediate(cb, 'Blockchain is loading');
    }

    return setImmediate(cb, null, { fees: constants.fees });
};

API.prototype.getNethash = function (req, cb) {
    if (!__private.loaded) {
        return setImmediate(cb, 'Blockchain is loading');
    }

    return setImmediate(cb, null, { nethash: modules.system.getNethash() });
};

API.prototype.getMilestone = function (req, cb) {
    if (!__private.loaded) {
        return setImmediate(cb, 'Blockchain is loading');
    }

    return setImmediate(cb, null, {
        milestone: __private.blockReward.calcMilestone(modules.blocks.lastBlock.get().height)
    });
};

API.prototype.getReward = function (req, cb) {
    if (!__private.loaded) {
        return setImmediate(cb, 'Blockchain is loading');
    }
    return setImmediate(cb, null, { reward: 0 });
    // __private.blockReward.calcReward(modules.blocks.lastBlock.get().height)}
};

API.prototype.getSupply = function (req, cb) {
    if (!__private.loaded) {
        return setImmediate(cb, 'Blockchain is loading');
    }
    return setImmediate(cb, null, { supply: __private.blockReward.calcSupply(modules.blocks.lastBlock.get().height) });
};

API.prototype.getStatus = function (req, cb) {
    if (!__private.loaded) {
        return setImmediate(cb, 'Blockchain is loading');
    }

    const lastBlock = modules.blocks.lastBlock.get();

    return setImmediate(cb, null, {
        broadhash: modules.system.getBroadhash(),
        epoch: constants.epochTime,
        height: lastBlock.height,
        fee: library.logic.block.calculateFee(),
        milestone: __private.blockReward.calcMilestone(lastBlock.height),
        nethash: modules.system.getNethash(),
        reward: 0, // __private.blockReward.calcReward(lastBlock.height)
        supply: __private.blockReward.calcSupply(lastBlock.height)
    });
};

/**
 * Handle modules initialization:
 * - blocks
 * - system
 * @param {modules} scope Exposed modules
 */
API.prototype.onBind = function (scope) {
    library.logger.trace('Blocks->API: Shared modules bind.');
    modules = {
        blocks: scope.blocks,
        system: scope.system,
    };

    // Set module as loaded
    __private.loaded = true;
};

module.exports = API;

/** ************************************* END OF FILE ************************************ */
