import { SHA256 } from "crypto-js";
import { Block, Transaction } from "./react-setup/src/components/types/block";
import BlockClass from "./react-setup/src/components/BlockClass";
export const TARGET_DIFFICULTY: bigint = BigInt(
  "0x0fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
);
export const MAX_TRANSACTIONS: number = 10;
import Blockchain from "./Blockchain";

const blockchain = Blockchain.instance;
let mempool: any[] = [];


export function addTransaction(transaction: Transaction) {
  mempool.push(transaction);
}

export function mine(): Block {
  const previousHash = blockchain.getLatestBlock().hash;
  const block: Block = new BlockClass('', previousHash);
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
  block.previousHash = blockchain.chain.length ? blockchain.chain[blockchain.chain.length - 1].hash : "";
  block.toHash = () => block.hash;
  blockchain.addBlock(block);

  return block;
}

export { mempool };
