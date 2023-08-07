import {
  BlockType,
  EthereumTransaction,
} from "../react-setup/src/types/block";
import { ethers } from "ethers";

class Block implements BlockType {
  static currentId = 0;
  parentHash: string;
  number: number;
  timestamp: number;
  nonce: string;
  difficulty: number;
  _difficulty: ethers.BigNumber;
  gasLimit: ethers.BigNumber;
  gasUsed: ethers.BigNumber;
  miner: string;
  extraData: string;
  transactions: string[];
  transactionsDetailed?: EthereumTransaction[];
  data: string;
  previousHash: string;
  hash: string;

  constructor(data: string, previousHash = "") {
    this.nonce = "0";
    this.transactions = [];
    this.transactionsDetailed = [];
    this.data = data;
    this.previousHash = previousHash;
    this.timestamp = Date.now();
    this.parentHash = "";
    this.number = 0;
    this.difficulty = 0;
    this._difficulty = ethers.BigNumber.from(0);
    this.gasLimit = ethers.BigNumber.from(0);
    this.gasUsed = ethers.BigNumber.from(0);
    this.miner = "";
    this.extraData = "";
    this.hash = this.toHash();
  }

  toHash(): string {
    const data = ethers.utils.defaultAbiCoder.encode(
      ["uint", "string", "uint", "string"],
      [this.timestamp, this.data, this.nonce, this.previousHash]
    );
    return ethers.utils.keccak256(data);
  }

  toObject(): object {
    return {
      nonce: this.nonce,
      hash: this.hash,
      transactions: this.transactions,
      transactionsDetailed: this.transactionsDetailed,
      data: this.data,
      previousHash: this.previousHash,
      timestamp: this.timestamp,
    };
  }
}

export default Block;
