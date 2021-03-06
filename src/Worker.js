import { getLogger } from 'log4js';
import path from 'path';
import Miner from './Miner';
import Requester from './revamp/Requester';

import WebSocket from 'ws';
import { createClass } from 'asteroid';

const Asteroid = createClass();
const logger = getLogger('worker');

export default class Worker {

    /**
     * Asteroid Client
     * 
     * This client is used to connect
     * with our Meteor Backend (miner-backend)
     * 
     * @type {Asteroid}
     */
    asteroid = null;

    constructor(config) {
        this.config = config;

        this.miner = new Miner(this.config);
        this.requester = new Requester({
            onData: (data) => {
                this.asteroid.call('addWorkerStats', this.config.workerId, data)
            }
        });
    }

    /**
     * Starts the whole worker
     */
    start() {
        logger.info(`Starting worker...`);

        this.setupAsteroid();
    }

    /**
     * Sets up the connection with the backend
     */
    setupAsteroid() {
        const { endpoint, email, password } = this.config.backend;

        // Connect with the backend
        this.asteroid = new Asteroid({
            endpoint,
            SocketConstructor: WebSocket
        })

        // We need this in order to know if we should stop/start
        // We do this by tracking the Worker.running variable
        this.asteroid.subscribe('Worker.currentWorker', this.config.workerId);
        this.asteroid.subscribe('Connection.current');

        this.asteroid.loginWithPassword({email, password})
        .catch(err => {
            logger.error(err);
        });

        this.asteroid.ddp.on('added', doc => {
            logger.debug(`[ddp]: onAdded: ${doc.collection}`);

            if(doc.collection === 'connections') {
                if(doc.fields) {
                    this.handleConnectionDocUpdate(doc);
                }
            }

            if(doc.collection === 'workers') {
                this.handleWorkerDocUpdate(doc);
            }
        });

        this.asteroid.ddp.on('changed', doc => {
            logger.debug(`[ddp]: onChanged: ${doc.collection}`);

            if(doc.collection === 'connections') {
                this.handleConnectionDocUpdate(doc);
            }

            if(doc.collection === 'workers') {
                this.handleWorkerDocUpdate(doc);
            }
        });

        this.asteroid.ddp.on('connected', () => {
            logger.info(`[ddp]: Connected with backend ${endpoint}`);

            this.asteroid.call('registerWorker', this.config.workerId);
        });

        this.asteroid.ddp.on('disconnected', () => {
            logger.error(`[ddp]: Connection to backend lost :/`);
            // We will stop all our activities
            this.toggleMiner(false);
        })

        this.asteroid.on('loggedIn', () => {
            logger.info(`[ddp]: Successfully logged in :)`);

            this.asteroid.call('getWorker', this.config.workerId);
        });
    }

    handleConnectionDocUpdate({fields: { id, error }}) {
        if(error) {
            logger.error(`[ddp]: ${error}`);
        }
    }

    async handleWorkerDocUpdate({fields: { running, name, wallet, email }}) {

        // Setup miner information
        // Information should only be
        // changed when miner is not running
        if(!this.miner.isRunning) {
            await this.setupMiner(name, wallet, email);
        }

        // Sync up our miner with backend
        this.toggleMiner(running);
    }

    async setupMiner(name, wallet, email) {
        if(name && name !== this.miner.name) {
            await this.miner.setName(name);
        }

        if(wallet && wallet !== this.miner.wallet) {
            await this.miner.setWallet(wallet);
        }

        if(email && email !== this.miner.email) {
            await this.miner.setEmail(email);
        }
    }

    toggleMiner(running) {
        if(running !== undefined) {
            if(running && !this.miner.isRunning) {
                this.miner.start();
                this.requester.start();
            } else if(!running && this.miner.isRunning) {
                this.miner.stop();
                this.requester.stop();
            }
        }
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