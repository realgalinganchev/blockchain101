#!/usr/bin/env node
import axios from 'axios';
import { program } from 'commander';
import chalk from 'chalk';
import { readFileSync } from 'fs';
import { ethers } from 'ethers';

const { Wallet, utils } = ethers;

// Load config
const config = JSON.parse(readFileSync(new URL('./config.json', import.meta.url)));

program
  .option('-n, --number <count>', 'Number of transactions to generate', config.defaults.transactions)
  .option('-u, --url <url>', 'Backend URL', config.backendUrl)
  .parse(process.argv);

const options = program.opts();
const backendUrl = options.url;
const count = parseInt(options.number);

// The node only accepts transactions signed for its chain id (EIP-155), see backend/src/constants/tx.ts
const CHAIN_ID = 1337;

const randomBetween = (min, max) => min + Math.random() * (max - min);

// A transfer signed by a fresh wallet, as the frontend does: the node recovers the
// sender from the signature, and a new wallet's first transaction has nonce 0.
async function generateTransaction() {
  const sender = Wallet.createRandom();
  const raw = await sender.signTransaction({
    chainId: CHAIN_ID,
    nonce: 0,
    to: Wallet.createRandom().address,
    value: utils.parseEther(randomBetween(0.01, 5).toFixed(4)),
    gasLimit: 21000, // Standard gas limit for ETH transfer
    gasPrice: utils.parseUnits(randomBetween(10, 60).toFixed(1), 'gwei'),
    data: '0x'
  });
  return { raw };
}

async function generateTransactions() {
  console.log(chalk.blue(`🔄 Generating ${count} transactions...`));

  let successful = 0;
  let failed = 0;

  for (let i = 0; i < count; i++) {
    try {
      const transaction = await generateTransaction();
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
    process.exitCode = 1; // so populate-devnet (and CI) stop instead of building on a partial chain
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
