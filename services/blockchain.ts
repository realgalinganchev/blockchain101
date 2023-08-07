import Blockchain from "../classes/Blockchain";
import { MAX_TRANSACTIONS } from "../constants/tx";
import { BlockType, EthereumTransaction } from "../react-setup/src/types/block";
import { constructBlock, createGenesisBlock, createNewBlock } from "../utils/block";
import { getSelectedTransactions, prepareTransactionsForBlock } from "../utils/transaction";
import { calculateProofOfWork } from "../utils/calc";
import { addTransactionToMempool, getTransactionsFromMempool, removeTransactionFromMempool } from "./db/mempool";
import { getBlocks, saveBlock } from "./db/blockchain";

const blockchain = Blockchain.instance;
let mempool: EthereumTransaction[] = [];

export async function initializeMempool() {
  mempool = await getTransactionsFromMempool();
}

export async function initializeBlockchain() {
  const blocksFromDB = await getBlocks();

  if (blocksFromDB.length === 0) {
    let genesisBlock = createGenesisBlock();
    blockchain.addBlock(genesisBlock);
    await saveBlock(genesisBlock);
  } else {
    blocksFromDB.forEach((blockData) => {
      let block = constructBlock(blockData);
      blockchain.addBlock(block);
    });
  }
}

export async function addTransaction(transaction: EthereumTransaction) {
  mempool.push(transaction);
  await addTransactionToMempool(transaction);
}

export async function mineBlock(): Promise<BlockType> {
  try {
    const previousHash = blockchain.getLatestBlock().hash;
    const blockNumber = blockchain.getLatestBlock().number + 1;
    let selectedTransactions: EthereumTransaction[] = getSelectedTransactions(
      mempool,
      MAX_TRANSACTIONS
    );
    selectedTransactions = prepareTransactionsForBlock(selectedTransactions);
    let block = createNewBlock(selectedTransactions, previousHash, blockNumber);
    calculateProofOfWork(block);
    blockchain.addBlock(block);

    await saveBlockToDatabase(block);
    await removeTransactionsFromMempool(selectedTransactions);

    return block;
  } catch (error) {
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

export { mempool };
