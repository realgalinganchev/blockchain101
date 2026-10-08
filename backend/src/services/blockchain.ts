import Block from "../classes/Block";
import Blockchain from "../classes/Blockchain";
import { MAX_TRANSACTIONS } from "../constants/tx";
import { calculateProofOfWork } from "../utils/calc";
import { constructBlock, createGenesisBlock, createNewBlock } from "../utils/block";
import { TransactionError, checkTransaction, decodeSignedTransaction } from "../utils/transaction";
import { validateChain } from "../utils/validate";
import { EthereumTransaction, StoredBlock } from "../types/block";
import { MAX_MINING_MS } from "../middleware/security";
import { publish } from "./events";
import { store } from "./db";

const blockchain = Blockchain.instance;
let mempool: EthereumTransaction[] = [];
let currentDifficulty = 4; // Number of leading zeros required
let currentMiningState = { hash: "", nonce: 0, isMining: false };
let shouldAbortMining = false;

// What the node already knows about mined transactions, for duplicate and nonce checks
const minedTxHashes = new Set<string>();
const minedTxCount = new Map<string, number>(); // sender -> transactions in blocks

function indexMinedTransactions(transactions: EthereumTransaction[]) {
  transactions.forEach((tx) => {
    minedTxHashes.add(tx.hash);
    minedTxCount.set(tx.from, (minedTxCount.get(tx.from) ?? 0) + 1);
  });
}

export async function initializeBlockchain() {
  blockchain.chain = [];
  minedTxHashes.clear();
  minedTxCount.clear();

  const stored = await store.getBlocks();
  if (stored.length === 0) {
    const genesis = createGenesisBlock();
    blockchain.chain.push(genesis);
    await store.saveBlock(genesis.toObject());
    return;
  }

  stored.forEach((data) => {
    blockchain.chain.push(constructBlock(data));
    indexMinedTransactions(data.transactionsDetailed ?? []);
  });
  const problems = validateChain(blockchain.chain);
  if (problems.length) console.warn(`The stored chain has ${problems.length} problem(s):\n  ${problems.join("\n  ")}`);
}

/** Restores pending transactions, dropping any that no longer pass validation. */
export async function initializeMempool() {
  mempool = [];
  for (const tx of await store.getMempool()) {
    if (!checkTransaction(tx) && !minedTxHashes.has(tx.hash)) {
      mempool.push(tx);
    } else {
      await store.removeFromMempool(tx.id);
    }
  }
}

/**
 * Accepts a raw signed transaction into the mempool. Like a real node, it rejects
 * duplicates and expects each sender's nonce to be their count of earlier transactions
 * (mined plus pending), which also stops the same signed transaction being replayed.
 */
export async function addTransaction(raw: unknown): Promise<EthereumTransaction> {
  const tx = decodeSignedTransaction(raw);

  if (minedTxHashes.has(tx.hash)) throw new TransactionError("This transaction is already in a block.", 409);
  if (mempool.some((t) => t.hash === tx.hash)) throw new TransactionError("This transaction is already in the mempool.", 409);

  const expectedNonce = (minedTxCount.get(tx.from) ?? 0) + mempool.filter((t) => t.from === tx.from).length;
  if (tx.nonce !== expectedNonce) {
    throw new TransactionError(`Nonce ${tx.nonce} is out of order: ${tx.from} has sent ${expectedNonce} transaction(s), so its next nonce is ${expectedNonce}.`);
  }

  mempool.push(tx);
  await store.addToMempool(tx);
  publish({ type: "mempool", size: mempool.length });
  return tx;
}

export async function mineBlock(): Promise<StoredBlock & { miningTime: number }> {
  currentMiningState = { hash: "", nonce: 0, isMining: true };
  shouldAbortMining = false;
  publish({ type: "mining", active: true });
  const startTime = Date.now();

  try {
    // Copy, don't remove: if mining is aborted the transactions stay pending.
    const selected = mempool.slice(0, MAX_TRANSACTIONS);
    const block = createNewBlock(selected, blockchain.getLatestBlock(), currentDifficulty);

    // On the public demo, give up after MAX_MINING_MS so one request can't hog the CPU.
    const deadline = MAX_MINING_MS > 0 ? startTime + MAX_MINING_MS : Infinity;
    try {
      await calculateProofOfWork(
        block,
        (hash, nonce) => {
          currentMiningState.hash = hash;
          currentMiningState.nonce = nonce;
          publish({ type: "progress", hash, nonce });
        },
        () => shouldAbortMining || Date.now() > deadline
      );
    } catch (error: any) {
      if (error.message === "Mining aborted" && Date.now() > deadline) throw new Error("Mining timed out");
      throw error;
    }

    // Validate before persisting, so an invalid block never reaches the database.
    blockchain.assertCanAppend(block);
    await store.saveBlock(block.toObject());
    blockchain.addBlock(block);
    indexMinedTransactions(selected);
    await removeTransactionsFromMempool(selected);

    publish({ type: "block", number: block.number, hash: block.hash });
    return { ...block.toObject(), miningTime: Date.now() - startTime };
  } finally {
    currentMiningState = { hash: "", nonce: 0, isMining: false };
    shouldAbortMining = false;
    publish({ type: "mining", active: false });
  }
}

async function removeTransactionsFromMempool(transactions: EthereumTransaction[]) {
  const ids = new Set(transactions.map((t) => t.id));
  mempool = mempool.filter((t) => !ids.has(t.id));
  await Promise.all(transactions.map((t) => store.removeFromMempool(t.id)));
  publish({ type: "mempool", size: mempool.length });
}

export function setDifficulty(difficulty: number) {
  currentDifficulty = difficulty;
  publish({ type: "difficulty", difficulty });
}

export function getDifficulty(): number {
  return currentDifficulty;
}

export function getMiningState() {
  return currentMiningState;
}

export function abortMining() {
  shouldAbortMining = true;
}

export function getChain(): StoredBlock[] {
  return blockchain.chain.map((block: Block) => block.toObject());
}

export function getMempool(): EthereumTransaction[] {
  return mempool;
}

export async function resetBlockchain() {
  shouldAbortMining = currentMiningState.isMining; // a block mined on the old chain could never be appended
  await store.clear();
  mempool = [];
  await initializeBlockchain();
  publish({ type: "reset" });
}
