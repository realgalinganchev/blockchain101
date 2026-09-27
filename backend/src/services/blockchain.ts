import Blockchain from "../classes/Blockchain";
import { MAX_TRANSACTIONS } from "../constants/tx";
import { calculateProofOfWork } from "../utils/calc";
import { getBlocks, saveBlock } from "./db/blockchain";
import { BlockType, EthereumTransaction } from "../types/block";
import { constructBlock, createGenesisBlock, createNewBlock } from "../utils/block";
import { getSelectedTransactions, prepareTransactionsForBlock } from "../utils/transaction";
import { addTransactionToMempool, getTransactionsFromMempool, removeTransactionFromMempool } from "./db/mempool";
import { MAX_MINING_MS } from "../middleware/security";

const blockchain = Blockchain.instance;
let mempool: EthereumTransaction[] = [];
let currentDifficulty = 4; // Number of leading zeros required
let miningProgressListeners: Array<(hash: string, nonce: number) => void> = [];
let currentMiningState = { hash: "", nonce: 0, isMining: false };
let shouldAbortMining = false;

export async function initializeMempool() {
  mempool = await getTransactionsFromMempool();
}

export async function initializeBlockchain() {
  const blocksFromDB = await getBlocks();

  if (blocksFromDB.length === 0) {
    let genesisBlock = createGenesisBlock();
    blockchain.chain.push(genesisBlock);
    await saveBlock(genesisBlock);
  } else {
    blocksFromDB.forEach((blockData) => {
      let block = constructBlock(blockData);
      blockchain.chain.push(block);
    });
  }
}

export async function addTransaction(transaction: EthereumTransaction) {
  mempool.push(transaction);
  await addTransactionToMempool(transaction);
}

export async function mineBlock(): Promise<BlockType & { miningTime: number }> {
  try {
    currentMiningState.isMining = true;
    shouldAbortMining = false;
    const startTime = Date.now();

    const previousHash = blockchain.getLatestBlock().hash;
    const blockNumber = blockchain.chain.length;
    let selectedTransactions: EthereumTransaction[] = getSelectedTransactions(
      mempool,
      MAX_TRANSACTIONS
    );
    selectedTransactions = prepareTransactionsForBlock(selectedTransactions);
    let block = createNewBlock(selectedTransactions, previousHash, blockNumber);

    // On the public demo, give up after MAX_MINING_MS so one request can't hog the CPU.
    const deadline = MAX_MINING_MS > 0 ? startTime + MAX_MINING_MS : Infinity;

    // Calculate proof of work with progress callback
    try {
      await calculateProofOfWork(block, currentDifficulty, (hash, nonce) => {
        currentMiningState.hash = hash;
        currentMiningState.nonce = nonce;
        miningProgressListeners.forEach(listener => listener(hash, nonce));
      }, () => shouldAbortMining || Date.now() > deadline);
    } catch (error: any) {
      if (error.message === "Mining aborted") {
        if (Date.now() > deadline) error = new Error("Mining timed out");
        console.log("Mining was aborted, cleaning up...");
        currentMiningState.isMining = false;
        currentMiningState.hash = "";
        currentMiningState.nonce = 0;
        shouldAbortMining = false;
        throw error; // Re-throw so the route handler knows mining was aborted
      }
      throw error;
    }

    blockchain.addBlock(block);

    await saveBlockToDatabase(block);
    await removeTransactionsFromMempool(selectedTransactions);

    const miningTime = Date.now() - startTime;
    currentMiningState.isMining = false;
    currentMiningState.hash = "";
    currentMiningState.nonce = 0;
    shouldAbortMining = false;
    return { ...block, miningTime };
  } catch (error) {
    currentMiningState.isMining = false;
    currentMiningState.hash = "";
    currentMiningState.nonce = 0;
    shouldAbortMining = false;
    throw error;
  }
}

async function removeTransactionsFromMempool(
  transactions: EthereumTransaction[]
) {
  const transactionIdsToRemove = new Set(transactions.map((t) => t.id));
  mempool = mempool.filter((t) => !transactionIdsToRemove.has(t.id));
  transactions.forEach((transaction) => {
    removeTransactionFromMempool(transaction.id);
  });
}

async function saveBlockToDatabase(block: BlockType) {
  await saveBlock(block);
}

export function setDifficulty(difficulty: number) {
  currentDifficulty = difficulty;
}

export function getDifficulty(): number {
  return currentDifficulty;
}

export function addMiningProgressListener(listener: (hash: string, nonce: number) => void) {
  miningProgressListeners.push(listener);
}

export function removeMiningProgressListener(listener: (hash: string, nonce: number) => void) {
  miningProgressListeners = miningProgressListeners.filter(l => l !== listener);
}

export function getMiningState() {
  return currentMiningState;
}

export function abortMining() {
  shouldAbortMining = true;
  currentMiningState.isMining = false;
  currentMiningState.hash = "";
  currentMiningState.nonce = 0;
}

export function getMempoolSize(): number {
  return mempool.length;
}

export function clearMempool() {
  mempool.length = 0;
}

export async function resetBlockchain() {
  blockchain.chain.length = 0;
  mempool.length = 0;
  const genesisBlock = createGenesisBlock();
  blockchain.chain.push(genesisBlock);
  await saveBlock(genesisBlock);
}

export { mempool };
