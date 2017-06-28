'use strict';

const logger = require('log4js').getLogger("parser");

class Parser {
    parseLine(line) {
        let parts = line.split("	");

        if(parts.length != 3) return logger.warn(`[Parser] Line should have 3 parts, we got ${parts.length} parts!`); 

        return this.parseInfo(parts[2]);
    }

    parseInfo(info) {
        logger.info(info);
    }
}

const parser = new Parser();
parser.parseLine("15:46:28:248	37f4	ETH: 06/28/17-15:46:28 - New job from eth-eu1.nanopool.org:9999");

module.exports = Parser;