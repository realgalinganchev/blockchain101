#!/usr/bin/env node
import axios from 'axios';
import { program } from 'commander';
import chalk from 'chalk';
import { readFileSync } from 'fs';
import { spawn } from 'child_process';

// Load config
const config = JSON.parse(readFileSync(new URL('./config.json', import.meta.url)));

program
  .option('-t, --transactions <count>', 'Number of transactions per block', config.defaults.transactions)
  .option('-b, --blocks <count>', 'Number of blocks to mine', config.defaults.blocks)
  .option('-d, --difficulty <level>', 'Mining difficulty (1-7)', config.defaults.difficulty)
  .option('-u, --url <url>', 'Backend URL', config.backendUrl)
  .parse(process.argv);

const options = program.opts();
const backendUrl = options.url;
const transactionCount = parseInt(options.transactions);
const blockCount = parseInt(options.blocks);
const difficulty = parseInt(options.difficulty);

function runScript(scriptName, args) {
  return new Promise((resolve, reject) => {
    const child = spawn('node', [scriptName, ...args], {
      stdio: 'inherit',
      cwd: import.meta.url.replace('file://', '').replace('/populate-devnet.js', '')
    });

    child.on('close', code => {
      if (code !== 0) {
        reject(new Error(`${scriptName} exited with code ${code}`));
      } else {
        resolve();
      }
    });
  });
}

async function waitForBackend() {
  console.log(chalk.blue('🔍 Checking backend availability...'));
  let retries = 30;
  while (retries > 0) {
    try {
      await axios.get(`${backendUrl}/mempool`);
      console.log(chalk.green('✓ Backend is ready'));
      return;
    } catch (error) {
      retries--;
      if (retries === 0) {
        throw new Error('Backend is not available');
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

async function populateDevnet() {
  console.log(chalk.bold.cyan('\n🚀 Blockchain Devnet Population Script\n'));
  console.log(chalk.gray('Configuration:'));
  console.log(chalk.gray(`  Backend URL: ${backendUrl}`));
  console.log(chalk.gray(`  Transactions: ${transactionCount}`));
  console.log(chalk.gray(`  Blocks: ${blockCount}`));
  console.log(chalk.gray(`  Difficulty: ${difficulty}\n`));

  try {
    // Wait for backend
    await waitForBackend();

    // Set difficulty
    console.log(chalk.blue(`⚙️  Setting difficulty to ${difficulty}...`));
    await axios.post(`${backendUrl}/difficulty`, { difficulty });
    console.log(chalk.green('✓ Difficulty set\n'));

    // Generate transactions and mine blocks in a loop
    console.log(chalk.bold.blue('Step 1: Populating Blockchain\n'));

    for (let i = 0; i < blockCount; i++) {
      console.log(chalk.cyan(`\n--- Block ${i + 1}/${blockCount} ---`));

      // Generate transactions for this block
      console.log(chalk.blue(`Generating ${transactionCount} transactions...`));
      await runScript('generate-transactions.js', ['-n', transactionCount, '-u', backendUrl]);

      // Mine the block
      console.log(chalk.blue('Mining block...'));
      await runScript('mine-blocks.js', ['-n', '1', '-u', backendUrl]);
    }

    // Final state
    console.log(chalk.bold.green('\n✅ Devnet population complete!\n'));

    const blockchain = await axios.get(`${backendUrl}/blockchain`);
    const mempool = await axios.get(`${backendUrl}/mempool`);

    console.log(chalk.cyan('📊 Final State:'));
    console.log(chalk.white(`  Blocks in chain: ${blockchain.data.length}`));
    console.log(chalk.white(`  Transactions in mempool: ${mempool.data.length}`));

    const totalTxs = blockchain.data.reduce((sum, block) => {
      return sum + (block.transactions?.length || 0);
    }, 0);
    console.log(chalk.white(`  Total transactions mined: ${totalTxs}`));

  } catch (error) {
    console.error(chalk.red('\n❌ Error:'), error.message);
    process.exit(1);
  }
}

populateDevnet();
