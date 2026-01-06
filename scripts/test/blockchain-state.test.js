#!/usr/bin/env node
import axios from 'axios';
import chalk from 'chalk';
import { readFileSync } from 'fs';

// Load config
const config = JSON.parse(readFileSync(new URL('../config.json', import.meta.url)));
const backendUrl = process.env.BACKEND_URL || config.backendUrl;

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
  if (condition) {
    testsPassed++;
    console.log(chalk.green(`  ✓ ${message}`));
  } else {
    testsFailed++;
    console.log(chalk.red(`  ✗ ${message}`));
  }
}

function assertEqual(actual, expected, message) {
  if (actual === expected) {
    testsPassed++;
    console.log(chalk.green(`  ✓ ${message}`));
  } else {
    testsFailed++;
    console.log(chalk.red(`  ✗ ${message}`));
    console.log(chalk.gray(`    Expected: ${expected}, Got: ${actual}`));
  }
}

function assertGreaterThan(actual, expected, message) {
  if (actual > expected) {
    testsPassed++;
    console.log(chalk.green(`  ✓ ${message}`));
  } else {
    testsFailed++;
    console.log(chalk.red(`  ✗ ${message}`));
    console.log(chalk.gray(`    Expected > ${expected}, Got: ${actual}`));
  }
}

async function testBlockchainState() {
  console.log(chalk.bold.cyan('\n🧪 Blockchain State Tests\n'));

  try {
    // Test 1: Backend is accessible
    console.log(chalk.blue('Test Suite: Backend Connectivity'));
    try {
      await axios.get(`${backendUrl}/blockchain`);
      assert(true, 'Backend is accessible');
    } catch (error) {
      assert(false, `Backend is accessible - ${error.message}`);
      console.log(chalk.red('\n❌ Cannot connect to backend. Tests aborted.'));
      process.exit(1);
    }

    // Fetch blockchain
    const blockchainResponse = await axios.get(`${backendUrl}/blockchain`);
    const blocks = blockchainResponse.data;

    // Test 2: Blockchain exists and has blocks
    console.log(chalk.blue('\nTest Suite: Blockchain Structure'));
    assertGreaterThan(blocks.length, 0, 'Blockchain has at least 1 block (genesis)');
    assertGreaterThan(blocks.length, 1, 'Blockchain has more than genesis block');

    // Test 3: Genesis block validation
    console.log(chalk.blue('\nTest Suite: Genesis Block'));
    if (blocks.length > 0) {
      // Sort blocks by timestamp to ensure genesis is first
      blocks.sort((a, b) => a.timestamp - b.timestamp);
      const genesis = blocks[0];
      assert(
        genesis.previousHash === '0' || genesis.previousHash === '0x0' || genesis.previousHash === '',
        'Genesis block has correct previousHash (0, 0x0, or empty)'
      );
      assert(genesis.hash && genesis.hash.length > 0, 'Genesis block has valid hash');
      assert(genesis.timestamp > 0, 'Genesis block has valid timestamp');
    }

    // Test 4: Block chain integrity
    console.log(chalk.blue('\nTest Suite: Blockchain Integrity'));
    let chainValid = true;
    for (let i = 1; i < blocks.length; i++) {
      const currentBlock = blocks[i];
      const previousBlock = blocks[i - 1];

      if (currentBlock.previousHash !== previousBlock.hash) {
        chainValid = false;
        assert(false, `Block ${i} links to previous block ${i - 1}`);
      }
    }
    if (chainValid && blocks.length > 1) {
      assert(true, 'All blocks are correctly linked in chain');
    }

    // Test 5: Block data field
    console.log(chalk.blue('\nTest Suite: Block Data'));
    let dataValid = true;
    blocks.forEach((block, i) => {
      if (block.data === undefined) {
        dataValid = false;
        assert(false, `Block ${i} has data field`);
      }
    });
    if (dataValid) {
      assert(true, 'All blocks have data field');
    }

    // Test 6: Block hashes
    console.log(chalk.blue('\nTest Suite: Block Hashes'));
    let hashesValid = true;
    blocks.forEach((block, i) => {
      if (!block.hash || block.hash.length === 0) {
        hashesValid = false;
        assert(false, `Block ${i} has valid hash`);
      } else if (!block.hash.startsWith('0x')) {
        hashesValid = false;
        assert(false, `Block ${i} hash starts with 0x (Ethereum format)`);
      }
    });
    if (hashesValid) {
      assert(true, 'All blocks have valid Ethereum-format hashes');
    }

    // Test 7: Transactions
    console.log(chalk.blue('\nTest Suite: Transactions'));
    let totalTxs = 0;
    blocks.forEach(block => {
      const txCount = block.transactions?.length || block.transactionsDetailed?.length || 0;
      totalTxs += txCount;
    });
    assertGreaterThan(totalTxs, 0, `Blockchain contains transactions (${totalTxs} total)`);

    // Verify transaction structure in at least one block
    let txValid = true;
    for (const block of blocks) {
      const txList = block.transactionsDetailed || block.transactions || [];
      if (txList.length > 0) {
        const tx = txList[0];
        if (!tx.from || !tx.to || tx.value === undefined) {
          txValid = false;
        }
        break;
      }
    }
    assert(txValid, 'Transactions have valid Ethereum structure (from, to, value)');

    // Test 8: Mempool state
    console.log(chalk.blue('\nTest Suite: Mempool'));
    const mempoolResponse = await axios.get(`${backendUrl}/mempool`);
    const mempool = mempoolResponse.data;
    assert(Array.isArray(mempool), 'Mempool returns array');
    console.log(chalk.gray(`    Mempool size: ${mempool.length}`));

    // Test 9: Difficulty setting
    console.log(chalk.blue('\nTest Suite: Difficulty'));
    const difficultyResponse = await axios.get(`${backendUrl}/difficulty`);
    const difficulty = difficultyResponse.data.difficulty;
    assert(
      difficulty >= 1 && difficulty <= 7,
      `Difficulty is within valid range (1-7): ${difficulty}`
    );

    // Test 10: Mining proof of work
    console.log(chalk.blue('\nTest Suite: Proof of Work'));
    let powValid = true;
    blocks.forEach((block, i) => {
      if (block.nonce === undefined || block.nonce === null) {
        powValid = false;
        assert(false, `Block ${i} has nonce`);
      }
    });
    if (powValid) {
      assert(true, 'All blocks have proof of work nonce');
    }

    // Test 11: Timestamps
    console.log(chalk.blue('\nTest Suite: Timestamps'));
    let timestampsValid = true;
    for (let i = 1; i < blocks.length; i++) {
      if (blocks[i].timestamp < blocks[i - 1].timestamp) {
        timestampsValid = false;
        assert(false, `Block ${i} timestamp is after block ${i - 1}`);
      }
    }
    if (timestampsValid && blocks.length > 1) {
      assert(true, 'Block timestamps are in chronological order');
    }

    // Summary
    console.log(chalk.bold.cyan('\n📊 Test Summary\n'));
    console.log(chalk.green(`  Passed: ${testsPassed}`));
    if (testsFailed > 0) {
      console.log(chalk.red(`  Failed: ${testsFailed}`));
    }
    console.log(chalk.white(`  Total:  ${testsPassed + testsFailed}`));

    console.log(chalk.cyan('\n📈 Blockchain Stats:\n'));
    console.log(chalk.white(`  Total blocks: ${blocks.length}`));
    console.log(chalk.white(`  Total transactions: ${totalTxs}`));
    console.log(chalk.white(`  Mempool size: ${mempool.length}`));
    console.log(chalk.white(`  Current difficulty: ${difficulty}`));

    if (testsFailed > 0) {
      console.log(chalk.red('\n❌ Some tests failed\n'));
      process.exit(1);
    } else {
      console.log(chalk.green('\n✅ All tests passed!\n'));
      process.exit(0);
    }

  } catch (error) {
    console.error(chalk.red('\n❌ Test suite error:'), error.message);
    process.exit(1);
  }
}

testBlockchainState();
