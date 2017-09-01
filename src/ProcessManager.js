import { spawn } from 'child_process';
import { getLogger } from 'log4js';

const logger = getLogger('manager');

export default class ProcessManager {
  constructor() {
    this.stdin = process.stdin;
    this.stdout = process.stdout;
    this.stderr = process.stderr;
  }
 
  runCommand(command, args) {
    logger.info(`Running ${command} ${args.join(' ')}`);
    return Promise.resolve(spawn(command, args, {
        stdio: [this.stdin, this.stdout, this.stderr]
    }));
  }

  killChild(child) {
    logger.info(`Killing pid ${child.pid}`);
    child.kill();
  }
}