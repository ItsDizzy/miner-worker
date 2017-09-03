import path from 'path';
import { getLogger } from 'log4js';
import ProcessManager from './ProcessManager';

const logger = getLogger('miner');

/**
 * The Miner
 * 
 * This class is mainly
 * to control the miner
 */
export default class Miner {

    /**
     * The miner's name
     * 
     * Note that this information will
     * be fetched from the backend
     * 
     * @type {String}
     */
    name = '';

    /**
     * The miner's wallet
     * 
     * Note that this information will
     * be fetched from the backend
     * 
     * @type {String}
     */
    wallet = '';

    /**
     * The miner's email address
     * 
     * Note that this information will
     * be fetched from the backend
     * 
     * @type {String}
     */
    email = '';

    /**
     * The miner's process
     * 
     * This will be a ChildProcess
     * once started
     * 
     * @type {ChildProcess}
     */
    process = null;

    /**
     * The Process Manager
     * 
     * This manager is used to
     * start and stop the miner
     * process
     * 
     * @type {ProcessManager}
     */
    manager = new ProcessManager();

    constructor(config) {
        this.config = config;

        this.host = config.miner.host;
        this.port = config.miner.port;
        
        this._last_seen = null;
        this._last_good = null;
    }

    get last_seen() {
        return this._last_seen ? this._last_seen : 'never';
    }

    set last_seen(date) {
        this._last_seen = date ? date : new Date(); 
    }

    get last_good() {
        return this._last_good ? this._last_good : 'never';
    }

    set last_good(date) {
        this._last_good = date ? date : new Date(); 
    }

    /**
     * Returns if the miner is running
     * @return {boolean}
     */
    get isRunning() {
        return !!this.process;
    }

    /**
     * Sets the miner's name
     * @param {String} name 
     */
    async setName(name) {
        this.name = name;
    }

    /**
     * Sets the miner's wallet
     * @param {String} wallet 
     */
    async setWallet(wallet) {
        this.wallet = wallet;
    }

    /**
     * Sets the miner's email address
     * @param {String} email 
     */
    async setEmail(email) {
        this.email = email;
    }

    /**
     * Starts the miner process
     */
    start() {
        logger.info(`Starting miner...`);
        if(!this.process) {
            const minerExe = path.join(this.config.locations.claymore, 'EthDcrMiner64.exe');
            const minerArgs = [
                '-epool', 'etc-eu1.nanopool.org:19999',
                '-ewal', `${this.wallet}.${this.name}/${this.email}`,
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