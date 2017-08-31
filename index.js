'use strict';

const path = require('path');
const logger = require('log4js').getLogger();
const Miner = require('./miner');
const Worker = require('./worker');

let config = {};
try {
    config = require('./config.json');
} catch(err) {
    logger.error("No config file found, ples make me one <3");
    logger.error(err);
}

// Some internal tests since the backend does not support our start/stop system yet
// const miner = new Miner(config);
// miner.start();

// setTimeout(() => {
//     miner.stop();
// }, 5000);

let worker = new Worker(config);
worker.start();