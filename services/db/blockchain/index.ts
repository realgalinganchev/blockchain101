import { db } from "../firebaseInit";
import { BlockType } from "../../../react-setup/src/types/block";

export async function getBlocks(): Promise<BlockType[]> {
  const snapshot = await db.collection("blockchain").get();
  return snapshot.docs.map((doc: any) => doc.data());
}

export async function saveBlock(block: BlockType) {
  let docRef = db.collection("blockchain").doc(block.hash);
  await docRef.set(block.toObject());
}
