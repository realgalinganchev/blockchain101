import { EthereumTransaction, StoredBlock } from "../../types/block";

/** Where the chain and the mempool are persisted (Firestore in production, memory locally). */
export interface Store {
  getBlocks(): Promise<StoredBlock[]>;
  saveBlock(block: StoredBlock): Promise<void>;
  getMempool(): Promise<EthereumTransaction[]>;
  addToMempool(tx: EthereumTransaction): Promise<void>;
  removeFromMempool(id: string): Promise<void>;
  /** Deletes every block and pending transaction. */
  clear(): Promise<void>;
}

/** Orders blocks by following the previousHash links from genesis (previousHash "0"). */
export function orderByLinks(blocks: StoredBlock[]): StoredBlock[] {
  const genesis = blocks.find((b) => b.previousHash === "0");
  if (!genesis) return blocks;

  const byParent = new Map(blocks.map((b) => [b.previousHash, b]));
  const ordered: StoredBlock[] = [];
  let current: StoredBlock | undefined = genesis;
  while (current) {
    ordered.push(current);
    current = byParent.get(current.hash);
  }
  return ordered;
}
