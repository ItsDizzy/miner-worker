'use strict';

const { EventEmitter } = require('events');
const chokidar = require('chokidar');

class Observer extends EventEmitter {
    constructor() {
        super();
        this.watchers = [];
    }

    addWatcher(path) {
        let watcher = chokidar.watch(path, {ignored: /^\./, persistent: true});
        this.watchers.push(watcher);

        this._initWatcherEvents(this.watchers.length - 1);

        console.log(`[Observer] New watcher added for ${path}, there is/are ${this.watchers.length} watcher(s).`);
    }

    removeWatcher() {
        throw new Error('Nop toooo lazyyyy!');
    }

    _initWatcherEvents(watcherId) {
        let watcher = this.watchers[watcherId];
        if(!watcher) return;

        watcher
            .on('add', path => {
                this.emit('w-add', {
                    id: watcherId,
                    path: path
                })
            })
            .on('change', path => {
                this.emit('w-change', {
                    id: watcherId,
                    path: path
                })
            })
            .on('unlink', path => {
                this.emit('w-unlink', {
                    id: watcherId,
                    path: path
                })
            })
            .on('error', error => {  
                console.error(`[Observer] Watcher#${watcherId} threw an error: `, error);
            })
    }

}

module.exports = Observer;