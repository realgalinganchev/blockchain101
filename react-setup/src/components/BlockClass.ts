import SHA256 from 'crypto-js/sha256';

class BlockClass {
  id: number; // Add id property
  nonce: number; // Add nonce property
  hash: string; // Add hash property
  transactions: any[]; // Add transactions property
  data: string; // Add data property
  previousHash: string; // Add previousHash property

  constructor(data: string, previousHash = '') {
    this.id = 0; // Initialize id with a default value
    this.nonce = 0; // Initialize nonce with a default value
    this.hash = ''; // Initialize hash with a default value
    this.transactions = []; // Initialize transactions as an empty array
    this.data = data;
    this.previousHash = previousHash;
  }

  toHash(): string {
    return SHA256(this.data + this.previousHash).toString();
  }
}

export default BlockClass;
