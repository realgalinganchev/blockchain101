import { ethers } from "ethers";

export interface EthereumTransaction
  extends ethers.providers.TransactionRequest {
  [key: string]: any;
  from: string;
  id: string;
  hash?: string;
}

export interface BlockType {
  id: number;
  nonce: number;
  hash: string;
  transactions: EthereumTransaction[];
  data: string;
  timestamp: number;
  previousHash: string;
  toHash: () => string;
  toObject: () => any;
}
