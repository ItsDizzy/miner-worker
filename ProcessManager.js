const { spawn } = require('child_process');
const logger = require('log4js').getLogger('manager');

class ProcessManager {
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

module.exports = ProcessManager;