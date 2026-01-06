#!/usr/bin/env node
import axios from 'axios';
import { program } from 'commander';
import chalk from 'chalk';
import { readFileSync } from 'fs';

// Load config
const config = JSON.parse(readFileSync(new URL('./config.json', import.meta.url)));

program
  .option('-u, --url <url>', 'Backend URL', config.backendUrl)
  .option('--min-blocks <count>', 'Minimum expected blocks', 1)
  .option('--strict', 'Fail if any validation fails')
  .parse(process.argv);

const options = program.opts();
const backendUrl = options.url;
const minBlocks = parseInt(options.minBlocks);
const strict = options.strict;

let errors = [];
let warnings = [];

function addError(message) {
  errors.push(message);
  console.log(chalk.red(`✗ ${message}`));
}

function addWarning(message) {
  warnings.push(message);
  console.log(chalk.yellow(`⚠ ${message}`));
}

function addSuccess(message) {
  console.log(chalk.green(`✓ ${message}`));
}

async function verifyState() {
  console.log(chalk.bold.cyan('\n🔍 Blockchain State Verification\n'));

  try {
    // Fetch blockchain
    const blockchainResponse = await axios.get(`${backendUrl}/blockchain`);
    const blocks = blockchainResponse.data;

    // Sort blocks by timestamp to ensure correct order
    blocks.sort((a, b) => a.timestamp - b.timestamp);

    console.log(chalk.blue('📊 Blockchain Statistics:'));
    console.log(chalk.white(`  Total blocks: ${blocks.length}`));

    // Verify minimum blocks
    if (blocks.length >= minBlocks) {
      addSuccess(`Blockchain has at least ${minBlocks} blocks`);
    } else {
      addError(`Expected at least ${minBlocks} blocks, found ${blocks.length}`);
    }

    // Verify genesis block
    if (blocks.length > 0) {
      const genesis = blocks[0];
      if (genesis.previousHash === '0' || genesis.previousHash === '0x0') {
        addSuccess('Genesis block has correct previousHash');
      } else {
        addError(`Genesis block previousHash should be '0', found '${genesis.previousHash}'`);
      }
    }

    // Verify block chain integrity
    let chainValid = true;
    for (let i = 1; i < blocks.length; i++) {
      const currentBlock = blocks[i];
      const previousBlock = blocks[i - 1];

      if (currentBlock.previousHash !== previousBlock.hash) {
        addError(`Block ${i} previousHash doesn't match block ${i-1} hash`);
        chainValid = false;
      }
    }

    if (chainValid && blocks.length > 1) {
      addSuccess('All blocks are correctly linked');
    }

    // Count transactions
    let totalTxs = 0;
    blocks.forEach(block => {
      totalTxs += block.transactions?.length || 0;
    });
    console.log(chalk.white(`  Total transactions: ${totalTxs}`));

    // Check mempool
    const mempoolResponse = await axios.get(`${backendUrl}/mempool`);
    const mempool = mempoolResponse.data;
    console.log(chalk.white(`  Mempool size: ${mempool.length}`));

    if (mempool.length === 0) {
      addSuccess('Mempool is empty (all transactions mined)');
    } else {
      addWarning(`${mempool.length} transactions still in mempool`);
    }

    // Check difficulty
    const difficultyResponse = await axios.get(`${backendUrl}/difficulty`);
    console.log(chalk.white(`  Current difficulty: ${difficultyResponse.data.difficulty}`));

    // Verify hashes
    let validHashes = 0;
    let invalidHashes = 0;
    blocks.forEach((block, i) => {
      if (block.hash && block.hash.startsWith('0x')) {
        validHashes++;
      } else {
        invalidHashes++;
        addError(`Block ${i} has invalid hash format: ${block.hash}`);
      }
    });

    if (invalidHashes === 0 && blocks.length > 0) {
      addSuccess('All block hashes are valid');
    }

    // Summary
    console.log(chalk.bold.cyan('\n📝 Verification Summary:\n'));
    console.log(chalk.green(`  ✓ Passed: ${errors.length === 0 ? 'All checks' : blocks.length - errors.length}`));

    if (warnings.length > 0) {
      console.log(chalk.yellow(`  ⚠ Warnings: ${warnings.length}`));
      warnings.forEach(w => console.log(chalk.yellow(`    - ${w}`)));
    }

    if (errors.length > 0) {
      console.log(chalk.red(`  ✗ Errors: ${errors.length}`));
      errors.forEach(e => console.log(chalk.red(`    - ${e}`)));
    }

    if (errors.length === 0) {
      console.log(chalk.bold.green('\n✅ Blockchain state is valid!\n'));
      process.exit(0);
    } else {
      console.log(chalk.bold.red('\n❌ Blockchain state verification failed!\n'));
      if (strict) {
        process.exit(1);
      }
    }

  } catch (error) {
    console.error(chalk.red('\n❌ Error connecting to backend:'), error.message);
    process.exit(1);
  }
}

verifyState();
