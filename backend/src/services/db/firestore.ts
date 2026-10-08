import { db } from "./firebaseInit";
import { Store, orderByLinks } from "./store";
import { EthereumTransaction, StoredBlock } from "../../types/block";

const blocks = () => db.collection("blockchain");
const mempool = () => db.collection("mempool");

async function deleteAll(collection: FirebaseFirestore.CollectionReference) {
  const snapshot = await collection.get();
  const batch = db.batch();
  snapshot.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();
}

export const firestoreStore: Store = {
  async getBlocks() {
    const snapshot = await blocks().get();
    return orderByLinks(snapshot.docs.map((doc) => doc.data() as StoredBlock));
  },
  async saveBlock(block) {
    await blocks().doc(block.hash).set(block);
  },
  async getMempool() {
    const snapshot = await mempool().get();
    return snapshot.docs.map((doc) => doc.data() as EthereumTransaction);
  },
  async addToMempool(tx) {
    await mempool().doc(tx.id).set(tx);
  },
  async removeFromMempool(id) {
    await mempool().doc(id).delete();
  },
  async clear() {
    await deleteAll(blocks());
    await deleteAll(mempool());
  },
};
