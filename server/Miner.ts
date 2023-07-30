import { SHA256 } from "crypto-js";

export const TARGET_DIFFICULTY: bigint = BigInt(
  "0x0fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
);
export const MAX_TRANSACTIONS: number = 10;

let mempool: any[] = [];  
let blocks: any[] = []; 

interface Block {
  id: number;
  transactions?: any[];  
  nonce?: number;
  hash?: string;
}

export function addTransaction(transaction: any) {
  mempool.push(transaction);
}

export function mine(): void {
  let blocks: any[] = [];
  const block: Block = { id: blocks.length };
  if (mempool.length > MAX_TRANSACTIONS) {
    block.transactions = mempool.splice(0, MAX_TRANSACTIONS);
  } else {
    block.transactions = [...mempool];
    mempool.length = 0;
  }

  let hashOfBlock: string;
  let n = 0;
  do {
    block.nonce = n;
    hashOfBlock = SHA256(JSON.stringify(block)).toString();
    n++;
  } while (BigInt(`0x${hashOfBlock}`) > TARGET_DIFFICULTY);

  block.hash = hashOfBlock;
  blocks.push(block);
}

export { blocks, mempool };
