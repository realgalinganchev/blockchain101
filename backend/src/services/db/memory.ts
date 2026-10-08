import { Store } from "./store";
import { EthereumTransaction, StoredBlock } from "../../types/block";

/** In-process store for local development and tests: no Firebase needed, gone on restart. */
export function createMemoryStore(): Store {
  const blocks = new Map<string, StoredBlock>();
  const mempool = new Map<string, EthereumTransaction>();
  const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value));

  return {
    async getBlocks() {
      return [...blocks.values()].map(copy).sort((a, b) => a.number - b.number);
    },
    async saveBlock(block) {
      blocks.set(block.hash, copy(block));
    },
    async getMempool() {
      return [...mempool.values()].map(copy);
    },
    async addToMempool(tx) {
      mempool.set(tx.id, copy(tx));
    },
    async removeFromMempool(id) {
      mempool.delete(id);
    },
    async clear() {
      blocks.clear();
      mempool.clear();
    },
  };
}
