import { SHA256 } from "crypto-js";
import BlockClass from "../classes/Block";
import Blockchain from "../classes/Blockchain";
import { MAX_TRANSACTIONS, TARGET_DIFFICULTY } from "../constants/tx";
import { sha256 } from "ethereum-cryptography/sha256";
import { toHex, utf8ToBytes } from "ethereum-cryptography/utils";
import { keccak256 } from "ethereum-cryptography/keccak";
import { BlockType, TransactionType } from "../react-setup/src/components/types/block";

// the possible colors that the hash could represent
const COLORS: string[] = ["red", "green", "blue", "yellow", "pink", "orange"];

const blockchain = Blockchain.instance;
let mempool: any[] = [];

export function addTransaction(transaction: TransactionType) {
  mempool.push(transaction);
}

export function mine(): BlockType {
  const previousHash = blockchain.getLatestBlock().hash;
  const block: BlockType = new BlockClass("", previousHash);
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
  block.previousHash = blockchain.chain.length
    ? blockchain.chain[blockchain.chain.length - 1].hash
    : "";
  block.toHash = () => block.hash;
  blockchain.addBlock(block);

  return block;
}

export function findColor(hash: string): string | undefined {
  const rainbowTable = COLORS.map((c) => sha256(utf8ToBytes(c)));
  const hashBytes = utf8ToBytes(hash);

  for (let i = 0; i < rainbowTable.length; i++) {
    if (toHex(rainbowTable[i]) === toHex(hashBytes)) {
      return COLORS[i];
    }
  }
}

export function getAddress(publicKey: Uint8Array): Uint8Array {
  const firstByteOff = publicKey.slice(1);
  const hashMsg = keccak256(firstByteOff);
  const last20ofHash = hashMsg.slice(-20);
  return last20ofHash;
}

export { mempool };
