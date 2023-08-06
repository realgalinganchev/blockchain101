import { ethers } from "ethers";
import { db } from "./firebase/index";
import BlockClass from "../classes/Block";
import Blockchain from "../classes/Blockchain";
import { MAX_TRANSACTIONS, TARGET_DIFFICULTY } from "../constants/tx";
import {
  BlockType,
  EthereumTransaction,
} from "../react-setup/src/components/types/block";

const blockchain = Blockchain.instance;
let mempool: EthereumTransaction[] = [];

export async function initializeMempool() {
  const transactionsSnapshot = await db.collection("mempool").get();
  const fetchedTransactions = transactionsSnapshot.docs.map(
    (doc: any) => doc.data() as EthereumTransaction
  );
  mempool = [...fetchedTransactions];
}

export async function initializeBlockchain() {
  const blocksFromDB = await getBlocks();

  if (blocksFromDB.length === 0) {
    let genesisBlock = new BlockClass("Genesis block", "0");
    genesisBlock.timestamp = Date.now();
    genesisBlock.nonce = ethers.utils.hexlify(0);
    blockchain.addBlock(genesisBlock);
    genesisBlock.hash = genesisBlock.toHash();

    try {
      let genesisBlockData = genesisBlock.toObject();
      // Use the hash as the document ID
      let docRef = db.collection("blockchain").doc(genesisBlock.hash);
      await docRef.set(genesisBlockData);
    } catch (error) {
      console.error("Error writing genesis block to Firestore: ", error);
    }
  } else {
    for (const blockData of blocksFromDB) {
      let block = new BlockClass(blockData.data, blockData.previousHash);
      block.timestamp = blockData.timestamp;
      block.transactions = blockData.transactions;
      block.transactionsDetailed = blockData.transactionsDetailed;
      block.difficulty = blockData.difficulty;
      block.gasLimit =
        blockData.gasLimit !== undefined
          ? ethers.BigNumber.from(blockData.gasLimit)
          : ethers.BigNumber.from(0);
      block.gasUsed =
        blockData.gasUsed !== undefined
          ? ethers.BigNumber.from(blockData.gasUsed)
          : ethers.BigNumber.from(0);
      block.miner = blockData.miner;
      block.extraData = blockData.extraData;
      blockchain.addBlock(block);
    }
  }
}

export async function addTransaction(transaction: EthereumTransaction) {
  mempool.push(transaction);

  try {
    let docRef = db.collection("mempool").doc(transaction.id);
    await docRef.set(transaction);
  } catch (error) {
    console.error("Error writing transaction to Firestore: ", error);
  }
}
export async function mine(): Promise<BlockType> {
  try {
    console.log("Mining started...");
    const previousHash = blockchain.getLatestBlock().hash;
    const block = new BlockClass("", previousHash);
    let selectedTransactions: EthereumTransaction[] = mempool.splice(
      0,
      Math.min(mempool.length, MAX_TRANSACTIONS)
    );
    selectedTransactions = prepareTransactionsForBlock(selectedTransactions);
    selectedTransactions.forEach((tx) => {
      if (isNaN(Number(tx.gas))) {
        console.log("Invalid gas value:", tx);
      }
    });

    block.transactions = selectedTransactions.map((t) => t.hash || "");
    block.transactionsDetailed = selectedTransactions;
    calculateProofOfWork(block);
    console.log("Setting block attributes...");
    block.number = blockchain.getLatestBlock().number + 1;
    block.difficulty = 100;
    block.gasLimit = ethers.BigNumber.from(5000000);
    block.gasUsed = ethers.BigNumber.from(
      selectedTransactions
        .filter(
          (tx) => typeof tx.gas === "number" || typeof tx.gasLimit === "number"
        )
        .reduce((sum, tx) => sum + Number(tx.gas || tx.gasLimit), 0)
    );
    block.miner = "0x1234567890abcdef"; 
    block.extraData = ""; 

    console.log("Adding block to blockchain...");
    blockchain.addBlock(block);

    console.log("Saving block to database...");
    await saveBlockToDatabase(block);

    console.log("Removing transactions from mempool...");
    await removeTransactionsFromMempool(selectedTransactions);

    console.log("Mining completed:");
    return block;
  } catch (error) {
    console.error("Error during mining:", error);
    throw error;
  }
}

function prepareTransactionsForBlock(
  selectedTransactions: EthereumTransaction[]
): EthereumTransaction[] {
  return selectedTransactions.map((transaction) => {
    const transactionFields = [
      toHexString(transaction.nonce),
      toHexString(transaction.gasPrice),
      toHexString(transaction.gasLimit),
      transaction.to,
      toHexString(transaction.value),
      transaction.data,
    ];

    const rlpEncoded = ethers.utils.RLP.encode(transactionFields);
    const rawTransactionHash = ethers.utils.keccak256(rlpEncoded);

    return {
      ...transaction,
      hash: rawTransactionHash,
    };
  });
}

function toHexString(value: ethers.BigNumberish | undefined): string {
  if (value === undefined) {
    throw new Error("Value is undefined");
  }

  return typeof value === "string"
    ? value
    : ethers.BigNumber.from(value).toHexString();
}

function calculateProofOfWork(block: BlockType): BlockType {
  let n = 0;
  do {
    block.nonce = ethers.utils.hexlify(n);
    block.hash = block.toHash();
    n++;
  } while (BigInt(`${block.hash}`) > TARGET_DIFFICULTY);

  block.timestamp = Date.now();
  return block;
}

async function saveBlockToDatabase(block: BlockType) {
  try {
    let blockData = block.toObject();
    let docRef = db.collection("blockchain").doc(block.hash);
    await docRef.set(blockData);
  } catch (error) {
    console.error("Error writing to Firestore: ", error);
  }
}

async function removeTransactionsFromMempool(
  transactions: EthereumTransaction[]
) {
  const transactionIdsToRemove = new Set(transactions.map((t) => t.id));
  mempool = mempool.filter((t) => !transactionIdsToRemove.has(t.id));

  transactions.forEach((transaction) => {
    db.collection("mempool")
      .doc(transaction.id)
      .delete()
      .catch((error: any) => {
        console.error("Error removing transaction from Firestore: ", error);
      });
  });
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
