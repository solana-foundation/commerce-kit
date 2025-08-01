import { spawn } from 'child_process';

async function run() {
  let validator;
  try {
    console.log('Starting surfpool...');
    validator = spawn('surfpool', ['start', '--no-tui'], {
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: false
    });

    validator.stdout.on('data', (data) => {
      console.log(`surfpool: ${data}`);
    });

    validator.stderr.on('data', (data) => {
      console.error(`surfpool (stderr): ${data}`);
    });

    validator.on('error', (err) => {
      console.error('Failed to start surfpool process.', err);
    });
    
    // Wait for it to start
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('Running tests...');
    const testCommand = 'pnpm';
    const testArgs = ['jest', 'tests/integration.test.ts'];

    console.log(`Running command: ${testCommand} ${testArgs.join(' ')}`);
    const testProcess = spawn(testCommand, testArgs, { stdio: 'inherit' });

    await new Promise((resolve, reject) => {
      testProcess.on('close', code => {
        if (code === 0) {
          resolve(0);
        } else {
          reject(new Error(`Test process exited with code ${code}`));
        }
      });
      testProcess.on('error', err => {
        reject(err);
      });
    });
    
    console.log('Tests done! Stopping surfpool...');
    validator.kill('SIGKILL');
    
  } catch (error) {
    console.error('Error:', error.message);
    if (validator) {
      validator.kill('SIGKILL');
    }
    process.exit(1);
  }
}

run();