import { ethers } from "ethers";

export interface EthereumTransaction
  extends ethers.providers.TransactionRequest {
  [key: string]: any;
  from: string;
  id: string;
  hash?: string;
}

export interface BlockType extends Omit<ethers.providers.Block, 'transactions'> {
  [key: string]: any;
  transactionsDetailed?: EthereumTransaction[]; 
  data: string;
  timestamp: number;
  previousHash: string;
  toHash: () => string;
  toObject: () => any;
}
