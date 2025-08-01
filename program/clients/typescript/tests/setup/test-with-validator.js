import { spawn } from 'child_process';
import { setTimeout } from 'timers/promises';
import { platform } from 'os';

const config = {
  validatorStartupTime: parseInt(process.env.SOLANA_VALIDATOR_STARTUP_TIME) || 10_000,
  validatorArgs: (process.env.SOLANA_VALIDATOR_ARGS || '-r --account EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v tests/setup/mints/usdc.json --account Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB tests/setup/mints/usdt.json --bpf-program commkU28d52cwo2Ma3Marxz4Qr9REtfJtuUfqnDnbhT ../../target/deploy/commerce_program.so').split(' '),
  maxHealthCheckRetries: 10
};

let validatorProcess = null;

async function checkSolanaCLI() {
  try {
    const checkProcess = spawn('solana', ['--version'], { stdio: 'pipe' });
    const exitCode = await new Promise((resolve) => {
      checkProcess.on('close', resolve);
    });
    
    if (exitCode !== 0) {
      throw new Error();
    }
  } catch (error) {
    console.error('Solana CLI not found. Please install: https://docs.solana.com/cli/install-solana-cli-tools');
    process.exit(1);
  }
}

async function waitForValidator() {
  console.log('Waiting for validator to be ready...');
  await setTimeout(config.validatorStartupTime);
  for (let i = 0; i < config.maxHealthCheckRetries; i++) {
    try {
      const checkProcess = spawn('solana', ['cluster-version'], { stdio: 'pipe' });
      const exitCode = await new Promise((resolve) => {
        checkProcess.on('close', resolve);
      });
      
      if (exitCode === 0) {
        console.log('Validator is ready!');
        return;
      }
    } catch (error) {
      // Continue waiting
    }
    
    await setTimeout(1000);
  }
  
  throw new Error('Validator failed to start within timeout period');
}

async function runTestsWithValidator() {
  try {
    await checkSolanaCLI();
    
    console.log('Starting Solana test validator...');
    validatorProcess = spawn('solana-test-validator', config.validatorArgs, {
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: false
    });

    // Handle validator errors
    validatorProcess.on('error', (error) => {
      console.error('Failed to start validator:', error.message);
      process.exit(1);
    });

    await waitForValidator();

    console.log('Running tests...');
    const testProcess = spawn('bun', ['run', 'test:integration'], {
      stdio: 'inherit',
      shell: platform() === 'win32' // Windows compatibility
    });

    const testExitCode = await new Promise((resolve) => {
      testProcess.on('close', resolve);
    });

    console.log(`Tests completed with exit code: ${testExitCode}`);
    process.exit(testExitCode);

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

function cleanup() {
  if (validatorProcess && !validatorProcess.killed) {
    console.log('Shutting down Solana test validator...');
    
    // Graceful shutdown
    validatorProcess.kill('SIGTERM');
    
    // Force kill after 5 seconds
    setTimeout(() => {
      if (validatorProcess && !validatorProcess.killed) {
        validatorProcess.kill('SIGKILL');
      }
    }, 5000);
  }
}

process.on('exit', cleanup);
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  cleanup();
  process.exit(1);
});

runTestsWithValidator();