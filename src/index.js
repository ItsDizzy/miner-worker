import { getLogger } from 'log4js';
import Worker from './Worker';

const logger = getLogger('main');

let config = {};
try {
    config = require('../config.json');
} catch(err) {
    logger.error("No config file found, ples make me one <3");
    logger.error(err);
}

let worker = new Worker(config);
worker.start();