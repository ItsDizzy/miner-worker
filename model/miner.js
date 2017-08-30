'use strict';

class Miner {
    constructor(miner) {
        this.name = miner.name;
        this.host = miner.host;
        this.port = miner.port;
        this._hostname = miner.hostname;

        this._last_seen = null;
        this._last_good = null;
    }

    get hostname() {
        return this._hostname ? this._hostname : `${this.host}:${this.port}`;
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
}

module.exports = Miner;