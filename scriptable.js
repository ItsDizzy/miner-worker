const { spawn } = require('child_process');

class Scriptable {
  constructor() {
    this.stdin = process.stdin;
    this.stdout = process.stdout;
    this.stderr = process.stderr;
  }
 
  runCommand(command, args) {
    //return () => {
      console.log(`Running command: ${command} with args: ${args.join(' ')}`);
      //return execSync(hookScript, {stdio: [this.stdin, this.stdout, this.stderr]});

      spawn(command, args, {
        stdio: [this.stdin, this.stdout, this.stderr]
    });
    }
  //}
}

module.exports = Scriptable;