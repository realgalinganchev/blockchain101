import { ethers } from "ethers";

export interface EthereumTransaction extends  ethers.providers.TransactionRequest  {
  from: string;
  id: string;
}

export interface BlockType {
  id: number;
  nonce: number;
  hash: string;
  transactions: EthereumTransaction[];
  data: string;
  timestamp:number;
  previousHash: string;
  toHash: () => string;
  toObject: () => any;
}
