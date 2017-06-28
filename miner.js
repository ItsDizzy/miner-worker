'use strict';

class Miner {
    constructor(miner) {
        this.name = miner.name;
        this.host = miner.host;
        this.port = miner.port;
        this._hostname = miner.hostname;

        this.last_seen = null;
        this.last_good = null;
    }

    get hostname() {
        return this._hostname ? this._hostname : `${this.host}:${this.port}`;
    }
}

module.exports = Miner;