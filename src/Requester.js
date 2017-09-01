import { getLogger } from 'log4js';
import { EventEmitter } from 'events';
import { Socket } from 'net';
import Miner from './Miner';

const logger = getLogger('requester');

export default class Requester extends EventEmitter {
    constructor(config, miner) {
        super();
        if(!miner instanceof Miner) return logger.error("Tried to init requester on an invalid miner object!");
        
        this.miner = miner;
        this.socket = new Socket();

        this.reqCnt = 0;
        this.rspCnt = 0;

        this.errored = false;
        this.timedout = false;
        
        // Config shiet
        this.poll = miner.poll ? miner.poll : config.miner_poll;
        this.timeout = miner.timeout ? miner.timeout : config.miner_timeout;

        //this.should_reconnect = true;

        //this.connect = this.connect.bind(this);

        this._initSocketEvents();
    }

    /**
     * Start the requester, by default the requester
     * will make a request every 5 seconds with the
     * miner and emit it's data, this can be changed
     * in the config, or by directly changing the
     * requester.poll time.
     * @deprecated
     */
    start() {
        throw new Error('This method is not supported anymore!');
        //this.should_reconnect = true;
        //this._connect();
    }

    /**
     * Stop the requester, this will also stop the polling
     * @deprecated
     */
    stop() {
        throw new Error('This method is not supported anymore!');
        // Little trick to let our socket not reconnect
        //this.should_reconnect = false;
        //this._disconnect();
    }

    /**
     * Connects to the miner
     */
    connect() {
        this.socket.connect(this.miner.port, this.miner.host);
    }

    /**
     * Force disconnects from the miner
     */
    disconnect() {
        this.socket.destroy();
    }

    /**
     * Initializes all socket events
     * @private
     */
    _initSocketEvents() {
        this.socket
            .on('connect', () => {
                logger.info(this.miner.name + ': connected to ' + this.socket.remoteAddress + ':' + this.socket.remotePort);
                
                var req = '{"id":0,"jsonrpc":"2.0","method":"miner_getstat1"}';
                ++this.reqCnt;

                logger.trace(this.miner.name + ': req[' + this.reqCnt + ']: ' + req);

                this.socket.write(req + '\n');
                this.socket.setTimeout(this.timeout);
            })

            .on('timeout', () => {
                logger.warn(this.miner.name + ': response timeout');
                this.socket.destroy();

                if(!this.timedout) {
                    this.emit('s-timeout', {
                        "name"       : this.miner.name,
                        "host"       : this.miner.hostname,
                        "error"      : 'Error: no response',
                        "last_seen"  : this.miner.last_seen
                    });
                }

                this.timedout = true;
            })

            .on('data', data => {
                
                ++this.rspCnt;
                
                logger.trace(`${this.miner.name}: rsp[${this.rspCnt}]: ${data.toString().trim()}`);
                
                this.miner.last_seen = new Date();//moment().format("YYYY-MM-DD HH:mm:ss");
                
                this.socket.setTimeout(0);

                let d = JSON.parse(data);
                
                this.emit('s-data', {
                    "name"       : this.miner.name,
                    "host"       : this.miner.hostname,
                    //"uptime"     : moment.duration(parseInt(d.result[1]), 'minutes').format('d [days,] hh:mm'),
                    "uptime"     : d.result[1],
                    "eth"        : d.result[2],
                    "dcr"        : d.result[4],
                    "eth_hr"     : d.result[3],
                    "dcr_hr"     : d.result[5],
                    "temps"      : d.result[6],
                    "pools"      : d.result[7],
                    "ver"        : d.result[0] 
                });

                this.timedout = false;
                this.errored = false;

                /*if (c.target_eth && config.tolerance) {
                    if (miners.json[i].eth.split(';')[0] / 1000 < c.target_eth * (1 - config.tolerance / 100)) {
                        miners.json[i].warning = 'Low hashrate';
                        miners.json[i].last_good = c.last_good ? c.last_good : 'never';
                    } else {
                        miners.json[i].warning = null;
                        c.last_good = moment().format("YYYY-MM-DD HH:mm:ss");
                    }
                }*/
            })

            .on('close', () => {
                logger.info(`${this.miner.name}: connection closed`);
                /*if(this.should_reconnect)
                    setTimeout(this._connect.bind(this), this.poll);*/
            })

            .on('error', err => {
                logger.error(`${this.miner.name}: socket error:  ${err.message}`);
                
                //if(!this.errored) {
                    this.emit('s-error', {
                        "name"       : this.miner.name,
                        "host"       : this.miner.hostname,
                        "error"      : err.message,
                        "last_seen"  : this.miner.last_seen
                    });
                //}

                //this.errored = true;
            });
    }
}