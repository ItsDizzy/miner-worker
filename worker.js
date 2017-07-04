'use strict';

const logger = require('log4js').getLogger('worker');
const path = require('path');
const Miner = require('./miner');
const Requester = require('./requester');
const io = require('socket.io-client');

class Worker {
    constructor(config) {
        this.config = config;

        this.backend = null;
        this.miner = new Miner(this.config.miner);
        this.requester = new Requester(this.config, this.miner);
    }

    start() {
        logger.info(`Starting worker...`);
        this._initBackend();
    }

    _initBackend() {
        this.backend = io(this.config.backend.host, {
            query: {
                name: this.config.miner.name,
                wallet: this.config.miner.wallet,
                secret: 'arandomkey...'
            }
        });

        this.backend.on('connect', this.onBackendConnect.bind(this));

        this.backend.on('heartbeat', this.onBackendHeartbeat.bind(this));

        this.backend.on('error', err => {
            logger.error(err);
        })

        this.backend.on('disconnect', this.onBackendDisconnected.bind(this));
    }

    /**
     * Handles the connect event
     * @event 'connect'
     */
    onBackendConnect() {
        logger.info(`Connected to backend ${this.config.backend.host}`);

        //this.requester.connect();

        this.requester
            .on('s-timeout', data => {
                this.backend.emit('m-timeout', data);
            })
            .on('s-data', data => {
                this.backend.emit('m-stats', data);
            })
            .on('s-error', data => {
                this.backend.emit('m-error', data);
            });
    }

    /**
     * Handles the heartbeat event
     * @event 'heartbeat'
     */
    onBackendHeartbeat() {
        logger.info(`Received heartbeat, requesting stats`);
        // TODO: For this to work the requester has to be rewritten a little bit, currently
        // the requester will request every 5000 ms. From now on the backend will tell
        // the worker when to send new information aka on each heartbeat.
        // Example how the requester will work
        // <help xD>idkkkk</help xD>
        this.requester.connect();
    }

    /**
     * Handles the disconnect event
     * @event 'disconnect'
     */
    onBackendDisconnected() {
        // CLEANUP!
        logger.info(`Disconnected from backend ${this.config.backend.host}`);

        this.requester.removeAllListeners();

        //this.logger.info(`Cleaning up our mess`);

        //console.log(this.backend.hasListeners('');

    }
}

module.exports = Worker;












































































//const { spawn } = require('child_process');
// const Scriptable = require('./scriptable');
// const path = require('path');
// const pty = require('pty.js');

// const wallet = '0x8e484c67ea367e05040aab0b4d80e1e366da0b1d';
// const worker = 'DizzyW';
// const email = 'luukwauben@hotmail.nl';

// const term = pty.spawn(path.join(__dirname, '..', path.sep, 'Ethereum Claymore Miner v9.3', 'EthDcrMiner64.exe'), [
//     '-epool', 'eth-eu1.nanopool.org:9999',
//     '-ewal', `${wallet}/${worker}/${email}`,
//     '-epsw', 'x',
//     '-mode', '1',
//     '-ftime', '10'
// ], {
//   name: 'xterm-color',
//   cols: 80,
//   rows: 30,
//   cwd: process.cwd(),
//   env: process.env
// });

// term.on('data', function(data) {
//   console.log(data);
// });

/*const defaults = {
  cwd: path.join(process.cwd(), '..', path.sep, 'Ethereum Claymore Miner v9.3'),
  env: process.env
};*/

// const scriptable = new Scriptable();

// scriptable.runCommand(path.join(__dirname, '..', path.sep, 'Ethereum Claymore Miner v9.3', 'EthDcrMiner64.exe'), [
//     '-epool', 'eth-eu1.nanopool.org:9999',
//     '-ewal', `${wallet}/${worker}/${email}`,
//     '-epsw', 'x',
//     '-mode', '1',
//     '-ftime', '10'
// ]);

// scriptable.stdout.on('data', (data) => {
//     console.log(data);
// })

// const miner = spawn(path.join(__dirname, '..', path.sep, 'Ethereum Claymore Miner v9.3', 'EthDcrMiner64.exe'), [
//     '-epool', 'eth-eu1.nanopool.org:9999',
//     '-ewal', `${wallet}/${worker}/${email}`,
//     '-epsw', 'x',
//     '-mode', '1',
//     '-ftime', '10'
// ], {
//     stdio: [0, 1, 2]
// });

//miner.stdout.pipe(process.stdout);

/*miner.stdout.on('data', (data) => {
  console.log(`stdout: ${data}`);
});*/

/*miner.stderr.on('data', (data) => {
  console.log(`stderr: ${data}`);
});

miner.on('close', (code) => {
  console.log(`child process exited with code ${code}`);
});
*/