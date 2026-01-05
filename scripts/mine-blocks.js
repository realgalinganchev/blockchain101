#!/usr/bin/env node
import axios from 'axios';
import { program } from 'commander';
import chalk from 'chalk';
import { readFileSync } from 'fs';

// Load config
const config = JSON.parse(readFileSync(new URL('./config.json', import.meta.url)));

program
  .option('-n, --number <count>', 'Number of blocks to mine', config.defaults.blocks)
  .option('-u, --url <url>', 'Backend URL', config.backendUrl)
  .parse(process.argv);

const options = program.opts();
const backendUrl = options.url;
const count = parseInt(options.number);

async function mineBlocks() {
  console.log(chalk.blue(`⛏️  Mining ${count} blocks...`));

  let successful = 0;
  let failed = 0;

  for (let i = 0; i < count; i++) {
    try {
      console.log(chalk.yellow(`⛏️  Mining block ${i + 1}/${count}...`));
      const startTime = Date.now();

      const response = await axios.get(`${backendUrl}/mine`);
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);

      successful++;
      console.log(chalk.green(`✓ Block ${i + 1} mined in ${duration}s`));
      console.log(chalk.gray(`  Hash: ${response.data.hash}`));
      console.log(chalk.gray(`  Nonce: ${response.data.nonce}`));
      console.log(chalk.gray(`  Transactions: ${response.data.transactions?.length || 0}`));

      // Add small delay to prevent concurrent mining attempts
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      failed++;
      if (error.response?.status === 499) {
        console.log(chalk.red(`✗ Block ${i + 1} mining aborted`));
      } else {
        console.log(chalk.red(`✗ Block ${i + 1} failed: ${error.message}`));
      }
      // Wait longer after error before retrying
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  console.log(chalk.blue(`\n📊 Summary:`));
  console.log(chalk.green(`  ✓ Blocks mined: ${successful}`));
  if (failed > 0) {
    console.log(chalk.red(`  ✗ Failed: ${failed}`));
  }

  // Check blockchain length
  try {
    const response = await axios.get(`${backendUrl}/blockchain`);
    console.log(chalk.yellow(`\n⛓️  Blockchain now contains ${response.data.length} blocks`));
  } catch (error) {
    console.log(chalk.red(`⚠️  Could not check blockchain: ${error.message}`));
  }
}

mineBlocks().catch(error => {
  console.error(chalk.red('Error:'), error.message);
  process.exit(1);
});
