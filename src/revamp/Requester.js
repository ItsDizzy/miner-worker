import { getLogger } from 'log4js';
import { Socket } from 'net';
import Miner from './Miner';

const logger = getLogger('requester');

export default class Requester {
  /**
   * This socket will connect
   * with the miner
   * 
   * @type {Socket}
   */
  socket = new Socket();

  /**
   * Requests count
   * 
   * Keeps track on the amount
   * of requests
   * 
   * @type {Number}
   */
  reqCount = 0;

  /**
   * Response count
   * 
   * Keeps track on the amount
   * of reponses
   * 
   * @type {Number}
   */
  resCount = 0;

  constructor(options) {
    this.config = Object.assign(options, {
      host: '127.0.0.1',
      port: 3333,
      timeout: 1000,
      message: '{"id":0,"jsonrpc":"2.0","method":"miner_getstat1"}',
      
      // Socket Events
      onConnect: () => {},
      onTimeout: () => {},
      onData: () => {},
      onClose: () => {},
      onError: () => {}
    });

    this.setupSocketEvents();
  }

  /**
   * Connect to the miner
   */
  connect() {
    this.socket.connect(this.config.port, this.config.host);
  }

  /**
   * Disconnect from the miner
   */
  disconnect() {
    this.socket.destroy();
  }

  setupSocketEvents() {
    this.socket
      .on('connect', () => {
        logger.info(`Connected to ${this.socket.remoteAddress}:${this.socket.remotePort}`);
        
        this.socket.setTimeout(this.config.timeout);

        // Update stats every 5 minutes
        setInterval(() => {
          this.socket.write(`${this.message}\n`);
        }, 5 * 1000 * 60);

        this.config.onConnect();
      })

      .on('timeout', () => {
        logger.warn('Response timeout');

        this.config.onTimeout();
      })

      .on('data', data => {
        // Convert the data to json first
        let data = data.toJSON();

        let hrAndShares = data.result[2].split(';');

        function getGpuTempsAndFanSpeeds(array) {
          return array.reduce((result, value, index, array) => {
            if(index % 2 === 0) {
              let pair = array.slice(index, index + 2);
              result.temps.push(pair[0]);
              result.fanSpeeds.push(pair[1]);
            }
            return result;
          }, {
            temps:[],
            fanSpeeds:[]
          });
        }

        const result = {
          version: data.result[0],
          uptime: data.result[1],
          hashrate: {
            total: hrAndShares[3],
            gpus: data.result[2].split(';'),
          },
          shares: {
            total: hrAndShares[2],
            rejected: hrAndShares[3]
          },
          ...getGpuTempsAndFanSpeeds(data.result[6].split(';')),
          pools: data.result[7].split(';')
        }

        this.config.onData(result);
      })

      .on('close', () => {
        logger.info('Connection closed');

        this.config.onClose();
      })

      .on('error', err => {
        logger.error(`Socket error: ${err.message}`);

        this.config.onError(err);
      });
    }
}