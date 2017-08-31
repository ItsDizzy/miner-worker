'use strict';

const logger = require('log4js').getLogger('worker');
const path = require('path');
const Miner = require('./model/miner');
const Requester = require('./requester');
const io = require('socket.io-client');

const WebSocket = require('ws');
const { createClass } = require('asteroid');
const Asteroid = createClass();

class Worker {
    constructor(config) {
        this.config = config;

        // Connection with Meteor Backend
        this.asteroid = null;

        // TODO: Move start and stop functions from the non
        // miner model to the miner model,
        // also move the requester to the miner
        this.miner = new Miner(this.config.miner);
        this.requester = new Requester(this.config, this.miner);
    }

    start() {
        logger.info(`Starting worker...`);

        this.setupAsteroid();
    }

    setupAsteroid() {
        const { endpoint, email, password } = this.config.backend;
        //const { name, wallet } = this.config.miner;

        // Connect with the backend
        this.asteroid = new Asteroid({
            endpoint,
            SocketConstructor: WebSocket
        });

        // We need this in order to know if we should stop/start
        // We do this by tracking the Worker.running variable
        this.asteroid.subscribe('Worker.currentWorker', this.config.workerId);

        this.asteroid.ddp.on('added', doc => {
            if(doc.collection === 'workers') {
                this.handleWorkerDocUpdate(doc);
            }
        });

        this.asteroid.ddp.on('changed', doc => {
            if(doc.collection === 'workers') {
                this.handleWorkerDocUpdate(doc);
            }
        });

        this.asteroid.ddp.on('connected', () => {
            logger.info(`[ddp]: Connected with backend ${endpoint}`);

            this.asteroid.loginWithPassword({email, password})
                .catch(err => {
                    logger.error(err);
                });
        });

        this.asteroid.ddp.on('loggedIn', () => {
            logger.info(`[ddp]: Successfully logged in :)`);

            this.asteroid.call('getWorker', this.config.workerId);
        });
    }

    handleWorkerDocUpdate(doc) {
        // Sync up our miner with backend
        if(doc.fields.running && !this.miner.isRunning) {
            this.miner.start();
        } else if(!doc.fields.running && this.miner.isRunning) {
            this.miner.stop();
        }
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