import SHA256 from "crypto-js/sha256";
import { TransactionType } from "../react-setup/src/components/types/block";

class Block {
  static currentId = 0;
  id: number;
  nonce: number;
  hash: string;
  transactions: TransactionType[];
  data: string;
  previousHash: string;

  constructor(data: string, previousHash = "") {
    this.id = Block.currentId++;
    this.nonce = 0;
    this.hash = "";
    this.transactions = [];
    this.data = data;
    this.previousHash = previousHash;
  }

  toHash(): string {
    return SHA256(this.data + this.previousHash).toString();
  }

  toObject(): object {
    return {
      id: this.id,
      nonce: this.nonce,
      hash: this.hash,
      transactions: this.transactions,
      data: this.data,
      previousHash: this.previousHash,
    };
  }
}

export default Block;
