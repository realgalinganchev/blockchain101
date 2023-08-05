import { SHA256 } from "crypto-js";
import BlockClass from "../classes/Block";
import Blockchain from "../classes/Blockchain";
import { MAX_TRANSACTIONS, TARGET_DIFFICULTY } from "../constants/tx";

import {
  BlockType,
  TransactionType,
} from "../react-setup/src/components/types/block";
import { db } from "./firebase/index";


const blockchain = Blockchain.instance;
let mempool: TransactionType[] = [];

export async function initializeMempool() {
  const transactionsSnapshot = await db.collection("mempool").get();
  const fetchedTransactions = transactionsSnapshot.docs.map(
    (doc: any) => doc.data() as TransactionType
  );
  mempool = [...fetchedTransactions];
}

export async function getMempoolTransactions() {
  const snapshot = await db.collection("mempool").get();
  return snapshot.docs.map((doc: any) => doc.data());
}

export async function initializeBlockchain() {
  const blocksFromDB = await getBlocks();
  if (blocksFromDB.length > 0) {
    for (const blockData of blocksFromDB) {
      let block = new BlockClass(blockData.data, blockData.previousHash);
      block.id = blockData.id;
      block.timestamp = blockData.timestamp;
      block.nonce = blockData.nonce;
      block.hash = blockData.hash;
      block.transactions = blockData.transactions;
      blockchain.addBlock(block);
    }
  }
}

export async function addTransaction(transaction: TransactionType) {
  mempool.push(transaction);

  try {
    let docRef = db.collection("mempool").doc(transaction.id);
    await docRef.set(transaction);
  } catch (error) {
    console.error("Error writing transaction to Firestore: ", error);
  }
}

export async function mine(): Promise<BlockType> {
  const previousHash = blockchain.getLatestBlock().hash;
  const block: BlockType = new BlockClass("", previousHash);

  let selectedTransactions: TransactionType[] = [];

  if (mempool.length > MAX_TRANSACTIONS) {
    selectedTransactions = mempool.splice(0, MAX_TRANSACTIONS);
  } else {
    selectedTransactions = [...mempool];
    mempool.length = 0;
  }

  block.transactions = selectedTransactions;

  let hashOfBlock: string;
  let n = 0;
  do {
    block.nonce = n;
    hashOfBlock = SHA256(JSON.stringify(block)).toString();
    n++;
  } while (BigInt(`0x${hashOfBlock}`) > TARGET_DIFFICULTY);

  block.hash = hashOfBlock;
  block.timestamp = Date.now();
  block.previousHash = blockchain.chain.length
    ? blockchain.chain[blockchain.chain.length - 1].hash
    : "";
  block.toHash = () => block.hash;
  blockchain.addBlock(block);

  try {
    let blockData = block.toObject();
    let docRef = db.collection("blockchain").doc(block.hash);
    await docRef.set(blockData);
  } catch (error) {
    console.error("Error writing to Firestore: ", error);
  }

  selectedTransactions.forEach((transaction) => {
    const index = mempool.findIndex((t) => t.id === transaction.id);
    if (index !== -1) {
      mempool.splice(index, 1);
    }
    db.collection("mempool")
      .doc(transaction.id)
      .delete()
      .catch((error: any) => {
        console.error("Error removing transaction from Firestore: ", error);
      });
  });

  return block;
}

export async function getBlocks() {
  const snapshot = await db.collection("blockchain").get();
  return snapshot.docs.map((doc: any) => doc.data());
}

export async function deleteAllBlocks() {
  const blocksSnapshot = await db.collection("blockchain").get();

  blocksSnapshot.docs.forEach((doc: any) => {
    doc.ref.delete();
  });
}

export { mempool };
