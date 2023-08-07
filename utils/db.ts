import {
  BlockType,
  EthereumTransaction,
} from "../react-setup/src/components/types/block";
import { db } from "../services/firebase";
import BlockClass from "../classes/Block";

export async function saveBlock(block: BlockClass) {
  try {
    const genesisBlockData = block.toObject();
    const docRef = db.collection("blockchain").doc(block.hash);
    await docRef.set(genesisBlockData);
  } catch (error) {
    console.error("Error writing genesis block to Firestore: ", error);
  }
}

export async function saveBlockToDatabase(block: BlockType) {
  try {
    let blockData = block.toObject();
    let docRef = db.collection("blockchain").doc(block.hash);
    await docRef.set(blockData);
  } catch (error) {
    console.error("Error writing to Firestore: ", error);
  }
}

export async function saveTransaction(transaction: EthereumTransaction) {
  try {
    let docRef = db.collection("mempool").doc(transaction.id);
    await docRef.set(transaction);
  } catch (error) {
    console.error("Error writing transaction to Firestore: ", error);
  }
}

export async function removeTransactionsFromMempool(
  transactions: EthereumTransaction[] = [],
  mempool: EthereumTransaction[]
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
