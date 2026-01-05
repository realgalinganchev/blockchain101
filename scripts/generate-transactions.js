#!/usr/bin/env node
import axios from 'axios';
import { program } from 'commander';
import chalk from 'chalk';
import { readFileSync } from 'fs';
import { randomBytes } from 'crypto';

// Load config
const config = JSON.parse(readFileSync(new URL('./config.json', import.meta.url)));

program
  .option('-n, --number <count>', 'Number of transactions to generate', config.defaults.transactions)
  .option('-u, --url <url>', 'Backend URL', config.backendUrl)
  .parse(process.argv);

const options = program.opts();
const backendUrl = options.url;
const count = parseInt(options.number);

// Generate random Ethereum-like address
function generateAddress() {
  return '0x' + randomBytes(20).toString('hex');
}

// Generate random transaction
function generateTransaction() {
  return {
    id: randomBytes(16).toString('hex'),
    from: generateAddress(),
    to: generateAddress(),
    value: Math.floor(Math.random() * 1000000000000), // Max ~0.000001 ETH in wei
    gasLimit: 21000, // Standard gas limit for ETH transfer
    gasPrice: Math.floor(Math.random() * 100000000), // Max 100 Gwei
    nonce: Math.floor(Math.random() * 100),
    data: '0x'
  };
}

async function generateTransactions() {
  console.log(chalk.blue(`🔄 Generating ${count} transactions...`));

  let successful = 0;
  let failed = 0;

  for (let i = 0; i < count; i++) {
    try {
      const transaction = generateTransaction();
      await axios.post(`${backendUrl}/transaction`, transaction);
      successful++;
      console.log(chalk.green(`✓ Transaction ${i + 1}/${count} added`));
    } catch (error) {
      failed++;
      console.log(chalk.red(`✗ Transaction ${i + 1}/${count} failed: ${error.message}`));
    }
  }

  console.log(chalk.blue(`\n📊 Summary:`));
  console.log(chalk.green(`  ✓ Successful: ${successful}`));
  if (failed > 0) {
    console.log(chalk.red(`  ✗ Failed: ${failed}`));
  }

  // Check mempool
  try {
    const response = await axios.get(`${backendUrl}/mempool`);
    console.log(chalk.yellow(`\n💾 Mempool now contains ${response.data.length} transactions`));
  } catch (error) {
    console.log(chalk.red(`⚠️  Could not check mempool: ${error.message}`));
  }
}

generateTransactions().catch(error => {
  console.error(chalk.red('Error:'), error.message);
  process.exit(1);
});
