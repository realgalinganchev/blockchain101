import { EthereumTransaction, StoredBlock } from "../types/block";
import { powHash, sealHash } from "../utils/hash";

class Block implements StoredBlock {
  number: number;
  timestamp: number;
  previousHash: string;
  transactionsRoot: string;
  difficulty: number;
  data: string;
  nonce: string;
  hash: string;
  gasUsed: string;
  transactions: string[];
  transactionsDetailed: EthereumTransaction[];

  constructor(fields: Omit<StoredBlock, "hash" | "nonce"> & { nonce?: string; hash?: string }) {
    this.number = fields.number;
    this.timestamp = fields.timestamp;
    this.previousHash = fields.previousHash;
    this.transactionsRoot = fields.transactionsRoot;
    this.difficulty = fields.difficulty;
    this.data = fields.data;
    this.gasUsed = fields.gasUsed;
    this.transactions = fields.transactions;
    this.transactionsDetailed = fields.transactionsDetailed;
    this.nonce = fields.nonce ?? "0x00";
    this.hash = fields.hash ?? this.toHash();
  }

  sealHash(): string {
    return sealHash(this);
  }

  toHash(): string {
    return powHash(this.sealHash(), this.nonce);
  }

  toObject(): StoredBlock {
    return {
      number: this.number,
      timestamp: this.timestamp,
      previousHash: this.previousHash,
      transactionsRoot: this.transactionsRoot,
      difficulty: this.difficulty,
      data: this.data,
      nonce: this.nonce,
      hash: this.hash,
      gasUsed: this.gasUsed,
      transactions: this.transactions,
      transactionsDetailed: this.transactionsDetailed,
    };
  }
}

export default Block;
