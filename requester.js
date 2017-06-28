'use strict';

const logger = require('log4js').getLogger('requester');
const { EventEmitter } = require('events');
const net = require('net');
const Miner = require('./miner');
const moment = require('moment');
require("moment-duration-format");

class Requester extends EventEmitter {
    constructor(config, miner) {
        super();
        if(!miner instanceof Miner) return logger.error("Tried to init requester on an invalid miner object!");
        
        this.miner = miner;
        this.socket = new net.Socket();

        this.reqCnt = 0;
        this.rspCnt = 0;

        // Config shiet
        this.poll = miner.poll ? miner.poll : config.miner_poll;
        this.timeout = miner.timeout ? miner.timeout : config.miner_timeout;

        this.connect = this.connect.bind(this);

        this._initSocketEvents();
    }

    connect() {
        this.socket.connect(this.miner.port, this.miner.host);
    }

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
                
                this.emit('data', {
                    "name"       : this.miner.name,
                    "host"       : this.miner.hostname,
                    "uptime"     : "",
                    "eth"        : "",
                    "dcr"        : "",
                    "eth_hr"     : "",
                    "dcr_hr"     : "",
                    "temps"      : "",
                    "pools"      : "",
                    "ver"        : "",
                    "target_eth" : "",
                    "target_dcr" : "",
                    //"comments"   : c.comments,
                    //"offline"    : c.offline,
                    "warning"    : null,
                    "error"      : 'Error: no response',
                    "last_seen"  : this.last_seen ? this.last_seen : 'never'
                });
            })

            .on('data', data => {
                
                ++this.rspCnt;
                
                logger.trace(`${this.miner.name}: rsp[${this.rspCnt}]: ${data.toString().trim()}`);
                
                this.last_seen = moment().format("YYYY-MM-DD HH:mm:ss");
                
                this.socket.setTimeout(0);

                let d = JSON.parse(data);
                
                this.emit('data', {
                    "name"       : this.miner.name,
                    "host"       : this.miner.hostname,
                    "uptime"     : moment.duration(parseInt(d.result[1]), 'minutes').format('d [days,] hh:mm'),
                    "eth"        : d.result[2],
                    "dcr"        : d.result[4],
                    "eth_hr"     : d.result[3],
                    "dcr_hr"     : d.result[5],
                    "temps"      : d.result[6],
                    "pools"      : d.result[7],
                    "ver"        : d.result[0],
                    //"target_eth" : c.target_eth,
                    //"target_dcr" : c.target_dcr,
                    //"comments"   : c.comments,
                    //"offline"    : c.offline,
                    //"ti"         : c.ti ? c.ti : null,
                    "error"      : null
                });

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
                setTimeout(this.connect.bind(this), this.poll);
            })

            .on('error', err => {
                logger.error(`${this.miner.name}: socket error:  ${this.miner.message}`);
                this.emit('data', {
                    "name"       : this.miner.name,
                    "host"       : this.miner.hostname,
                    "uptime"     : "",
                    "eth"        : "",
                    "dcr"        : "",
                    "eth_hr"     : "",
                    "dcr_hr"     : "",
                    "temps"      : "",
                    "pools"      : "",
                    "ver"        : "",
                    //"target_eth" : "",
                    //"target_dcr" : "",
                    //"comments"   : c.comments,
                    //"offline"    : c.offline,
                    "warning"    : null,
                    "error"      : `${this.miner.name}: ${err.message}`,
                    "last_seen"  : this.last_seen ? this.last_seen : 'never'
                });
            });
    }
}

module.exports = Requester;