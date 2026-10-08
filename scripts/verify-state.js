#!/usr/bin/env node
import axios from 'axios';
import { program } from 'commander';
import chalk from 'chalk';
import { readFileSync } from 'fs';
import { ethers } from 'ethers';

const { utils, constants } = ethers;

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

// Independent re-implementation of the node's rules (backend/src/utils/hash.ts and
// validate.ts), so this check doesn't just trust the API's own answers.
function merkleRoot(hashes) {
  if (hashes.length === 0) return constants.HashZero;
  let level = hashes;
  while (level.length > 1) {
    const next = [];
    for (let i = 0; i < level.length; i += 2) {
      next.push(utils.keccak256(utils.concat([level[i], level[i + 1] ?? level[i]])));
    }
    level = next;
  }
  return level[0];
}

function blockHash(block) {
  const seal = utils.keccak256(
    utils.defaultAbiCoder.encode(
      ['uint256', 'uint256', 'string', 'bytes32', 'uint8', 'string'],
      [block.number, block.timestamp, block.previousHash, block.transactionsRoot, block.difficulty, block.data]
    )
  );
  return utils.keccak256(utils.concat([seal, utils.hexZeroPad(block.nonce, 32)]));
}

// Problems with one block's contents: signatures, transactions root, hash and proof of work
function checkBlockContents(block, index) {
  const problems = [];
  const txs = block.transactionsDetailed ?? [];
  txs.forEach((tx, t) => {
    try {
      const signed = utils.parseTransaction(tx.raw);
      if (signed.hash !== tx.hash) problems.push(`tx ${t + 1}: hash isn't keccak256 of the signed bytes`);
      if (signed.from !== tx.from) problems.push(`tx ${t + 1}: sender doesn't match the signature`);
      if (signed.to.toLowerCase() !== tx.to.toLowerCase() || signed.value.toString() !== tx.value) {
        problems.push(`tx ${t + 1}: recipient or value doesn't match what was signed`);
      }
    } catch {
      problems.push(`tx ${t + 1}: not a valid signed transaction`);
    }
  });
  if (merkleRoot(txs.map((tx) => tx.hash)) !== block.transactionsRoot) problems.push("transactions root doesn't match");
  if (blockHash(block) !== block.hash) problems.push("hash doesn't match the header and nonce");
  if (index > 0 && !block.hash.startsWith('0x' + '0'.repeat(block.difficulty))) {
    problems.push(`hash doesn't meet difficulty ${block.difficulty}`);
  }
  return problems;
}

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

    // Recompute every block: signatures, transactions root, hash, proof of work
    let invalidBlocks = 0;
    blocks.forEach((block, i) => {
      const problems = checkBlockContents(block, i);
      if (problems.length) {
        invalidBlocks++;
        problems.forEach((problem) => addError(`Block ${i}: ${problem}`));
      }
    });

    if (invalidBlocks === 0 && blocks.length > 0) {
      addSuccess('Every block recomputes: signatures, transactions roots, hashes and proof of work');
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
