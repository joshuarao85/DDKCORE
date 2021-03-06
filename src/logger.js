const winston = require('winston');
require('winston-daily-rotate-file');

/**
 * @desc custom levels for winston logger
 */
const levels = {
    archive: 0,
    error: 1,
    warn: 2,
    info: 3,
    http: 4,
    verbose: 5,
    debug: 6,
    silly: 7,
    trace: 8,
};

/**
 * @desc Creating file transport to write logs into a file. This file daily rotates
 */
const transport = new (winston.transports.DailyRotateFile)({
    filename: 'logs/./log',
    datePattern: 'yyyy-MM-dd.',
    prepend: true,
    json: false,
    level: 'debug',
    timestamp() {
        const today = new Date();
        return today.toISOString();
    }
});

/**
 * @desc creating file transport to write archived logs into a file.
 * @desc Only "archive" logs will be written in this file.
 */
const traceTransport = new (winston.transports.File)({
    filename: './logs/archive.log',
    level: 'archive',
    levelOnly: true,
    prepend: true,
    json: false,
    timestamp() {
        const today = new Date();
        return today.toISOString();
    }
});

const consoleTransport = new (winston.transports.Console)({
    level: 'debug',
});


/**
 * @desc logger Constructor
 * @param {String} sessionId - session is to be written in each log
 * @param {String} address - address od the current logged-in user
 * @returns {Transport}
 */
class Logger {
    constructor(sessionId, address) {
        this.transport = transport;
        this.consoleTransport = consoleTransport;
        this.transport.formatter = function (options) {
            if (sessionId && address) {
                return `${options.timestamp()} - ${sessionId} - ${address} - [${options.level}] : ${options.message}`;
            } else if (sessionId) {
                return `${options.timestamp()} - ${sessionId} - [${options.level}] : ${options.message}`;
            } else if (address) {
                return `${options.timestamp()} - ${address} - [${options.level}] : ${options.message}`;
            }
            return `${options.timestamp()}  - [${options.level}] : ${options.message}`;
        };
        this.traceTransport = traceTransport;
        this.traceTransport.formatter = function (options) {
            return `${options.timestamp()}  - [${options.level}] : ${options.message}`;
        };
        this.logger = new (winston.Logger)({
            levels,
            transports: [this.traceTransport, this.transport, this.consoleTransport]
        });
    }
}

// exports module
module.exports = Logger;

/** ************************************* END OF FILE ************************************ */
