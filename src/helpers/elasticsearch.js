const utils = require('../utils');

const limit = 5000;
const dbTables = [
    {
        tableName: 'blocks_list',
        fieldName: 'b_id'
    },
    {
        tableName: 'trs',
        fieldName: 'id'
    },
    {
        tableName: 'stake_orders',
        fieldName: 'id'
    }
];

const iterate = async (db, logger, table, limit, rowsAcc, bulkAcc, lastValue) => {
    try {
        rowsAcc = await db.manyOrNone(
            'SELECT * FROM $(tableName~) WHERE $(fieldName~) > $(lastValue) ORDER BY $(fieldName~) LIMIT $(limit)',
            {
                tableName: table.tableName,
                fieldName: table.fieldName,
                lastValue,
                limit
            }
        );
        if (rowsAcc.length < 1) {
            return;
        }
        bulkAcc = utils.makeBulk(rowsAcc, table.tableName);
        await utils.indexall(bulkAcc, table.tableName);
        lastValue = rowsAcc[rowsAcc.length - 1][table.fieldName];
    } catch (err) {
        logger.error(`elasticsearch indexing error : ${err}`);
    }

    await iterate(db, logger, table, limit, rowsAcc, bulkAcc, lastValue);
};

module.exports.sync = (db, logger) => {
    const promises = [];
    dbTables.forEach((table) => {
        promises.push(iterate(db, logger, table, limit, [], [], ''));
    });
    Promise.all(promises).then(() => {
        logger.info('Elasticsearch indexed ok');
    });
};
