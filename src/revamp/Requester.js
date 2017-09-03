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

        /**
         * Formats the hashrate and temp/fanspeed array
         * into a nice array of gpu stats
         * 
         * @example An example of what it can return.
         * ```
         * [
         *  { hashrate: '30502', temp: '53', fanSpeed: '71' },
         *  { hashrate: '30457', temp: '57', fanSpeed: '67' },
         *  { hashrate: '30297', temp: '61', fanSpeed: '72' },
         *  { hashrate: '30481', temp: '55', fanSpeed: '70' },
         *  { hashrate: '30479', temp: '59', fanSpeed: '71' },
         *  { hashrate: '30505', temp: '61', fanSpeed: '70' }
         * ]
         * ```
         * 
         * @param {Array} hashrates 
         * @param {Array} tempFanArray 
         */
        function getGpus(hashrates, tempFanArray) {
          const pairs = tempFanArray.reduce((result, value, index, array) => {
            if(index % 2 === 0) {
              result.push(array.slice(index, index + 2));
            }
            return result;
          }, []);

          return pairs.map((pair, index) => {
            return {
              hashrate: hashrates[index],
              temp: pair[0],
              fanSpeed: pair[1]
            }
          })
        };

        function getHashrateAndShares(hrAndShares) {
          return {
            hashrate: hrAndShares[0],
            shares: {
              total: hrAndShares[1],
              rejected: hrAndShares[2]
            }
          }
        }

        const result = {
          version: data.result[0],
          uptime: data.result[1],
          gpus: getGpus(data.result[3].split(';'), data.result[6].split(';')),
          ...getHashrateAndShares(data.result[2].split(';')),
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