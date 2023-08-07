import { db } from "./firebase/index";
import Blockchain from "../classes/Blockchain";
import {
  BlockType,
  EthereumTransaction,
} from "../react-setup/src/components/types/block";
import {
  createBlock,
  createGenesisBlock,
  createNewBlock,
} from "../utils/block";
import {
  getBlocks,
  removeTransactionsFromMempool,
  saveBlock,
  saveBlockToDatabase,
  saveTransaction,
} from "../utils/db";

let mempool: EthereumTransaction[] = [];

const blockchain = Blockchain.instance;

export async function initializeMempool() {
  const transactionsSnapshot = await db.collection("mempool").get();
  mempool.push(
    ...transactionsSnapshot.docs.map(
      (doc: any) => doc.data() as EthereumTransaction
    )
  );
}

export async function initializeBlockchain() {
  const blocksFromDB = await getBlocks();

  if (blocksFromDB.length === 0) {
    const genesisBlock = createGenesisBlock();
    saveBlock(genesisBlock);
  } else {
    blocksFromDB.forEach((blockData) => {
      const block = createBlock(blockData);
      blockchain.addBlock(block);
    });
  }
}

export async function addTransaction(transaction: EthereumTransaction) {
  mempool.push(transaction);
  await saveTransaction(transaction);
}

export async function mineBlock(): Promise<BlockType> {
  const block = createNewBlock(mempool);
  await saveBlockToDatabase(block);
  await removeTransactionsFromMempool(block.transactionsDetailed, mempool);
  return block;
}

export { mempool };
