import { db } from "../firebaseInit";
import { EthereumTransaction } from "../../../react-setup/src/types/block";

export async function getTransactionsFromMempool(): Promise<
  EthereumTransaction[]
> {
  const transactionsSnapshot = await db.collection("mempool").get();
  return transactionsSnapshot.docs.map(
    (doc: any) => doc.data() as EthereumTransaction
  );
}

export async function addTransactionToMempool(
  transaction: EthereumTransaction
) {
  let docRef = db.collection("mempool").doc(transaction.id);
  await docRef.set(transaction);
}

export async function removeTransactionFromMempool(transactionId: string) {
  await db.collection("mempool").doc(transactionId).delete();
}
