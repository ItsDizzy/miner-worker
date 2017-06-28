'use strict';

const logger = require('log4js').getLogger('worker');
const path = require('path');
const Miner = require('./miner');
const Requester = require('./requester');
const io = require('socket.io-client');

class Worker {
    constructor(config) {
        this.config = config;

        //this.observer = new Observer();
        this.backend = null;
        this.miner = new Miner(this.config.miner);
        this.requester = new Requester(this.config, this.miner);
    }

    start() {
        //this._initObserver();

        //this._initRequester();
        this._initBackend();
    }

    _initBackend() {
        this.backend = io(this.config.backend.host);

        this.backend.on('connect', () => {
            this.backend.emit('identify', {
                name: this.config.miner.name,
                key: 'arandomkey...'
            });

            this.backend.on('identified', () => {
                this._initRequester();
            })
        })
    }

    _initRequester() {
        logger.info("PLS CONNECT NAW!");
        this.requester.connect();

        this.requester.on('data', data => {
            //logger.trace(data);
            this.backend.emit('data', data);
        })
    }

    _initObserver() {
        this.observer.addWatcher(path.join(__dirname, '..', path.sep));

        this.observer
            .on('w-add', data => {
                if(data.path.indexOf('_log.txt') > -1) {
                    console.log(`[Watcher#${data.id}] File ${data.path} has been added`);
                }
            })
            .on('w-change', data => {
                if(data.path.indexOf('_log.txt') > -1) {
                    console.log(`[Watcher#${data.id}] File ${data.path} has been changed`);
                }
            })
            .on('w-unlink', data => {
                if(data.path.indexOf('_log.txt') > -1) {
                    console.log(`[Watcher#${data.id}] File ${data.path} has been removed`);
                }
            });
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