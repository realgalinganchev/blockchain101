import SHA256 from 'crypto-js/sha256';
import { Transaction } from './types/block';

class BlockClass {
  static currentId = 0;
  id: number;
  nonce: number; 
  hash: string; 
  transactions: Transaction[]; 
  data: string; 
  previousHash: string;

  constructor(data: string, previousHash = '') {
    this.id = BlockClass.currentId++; 
    this.nonce = 0;
    this.hash = ''; 
    this.transactions = [];
    this.data = data;
    this.previousHash = previousHash;
  }

  toHash(): string {
    return SHA256(this.data + this.previousHash).toString();
  }
}

export default BlockClass;
