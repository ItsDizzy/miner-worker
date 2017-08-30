const path = require('path');
const logger = require('log4js').getLogger('miner');
const ProcessManager = require('./ProcessManager');

class Miner {
    constructor(config) {
        this.config = config;
        this.manager = new ProcessManager();

        this.process;
    }

    /**
     * Starts the miner process
     */
    start() {
        logger.info(`Starting miner...`);
        if(!this.process) {
            const { wallet, name, email } = this.config.miner;

            const minerExe = path.join(this.config.locations.claymore, 'EthDcrMiner64.exe');
            const minerArgs = [
                '-epool', 'etc-eu1.nanopool.org:19999',
                '-ewal', `${wallet}.${name}/${email}`,
                '-epsw', 'x',
                '-mode', '1',
                '-ftime', '10'
            ];

            this.manager.runCommand(minerExe, minerArgs).then(child => {
                this.process = child;
                logger.info(`Miner is running, pid: ${child.pid}`);
            });
        } else {
            logger.error(`Miner is already running! Our worker only supports one miner at a time right now!`);
        }
    }

    /**
     * Stops the miner process
     */
    stop() {
        logger.info(`Stopping miner...`);
        if(process) {
            this.manager.killChild(this.process);
            this.process = null;
        } else {
            logger.warn(`Nothing to stop...`);
        }
    }
}

module.exports = Miner;