import { db } from "../firebaseInit";
import { BlockType } from "../../../types/block";

export async function getBlocks(): Promise<BlockType[]> {
  const snapshot = await db.collection("blockchain").get();
  const blocks = snapshot.docs.map((doc: any) => doc.data());

  // Sort by following previousHash links from genesis (previousHash === "0")
  const genesis = blocks.find((b: any) => b.previousHash === "0");
  if (!genesis) return blocks;

  const hashMap = new Map(blocks.map((b: any) => [b.previousHash, b]));
  const sorted: BlockType[] = [];
  let current: any = genesis;
  while (current) {
    sorted.push(current);
    current = hashMap.get(current.hash);
  }
  return sorted;
}

export async function saveBlock(block: BlockType) {
  let docRef = db.collection("blockchain").doc(block.hash);
  await docRef.set(block.toObject());
}
