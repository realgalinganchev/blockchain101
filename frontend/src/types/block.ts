/** A signed transaction as the node returns it (see backend/src/types/block.ts). Amounts are wei as decimal strings. */
export interface EthereumTransaction {
  /** keccak256(raw): the Ethereum transaction hash */
  hash: string;
  id: string;
  /** the RLP-encoded signed transaction; everything else is decoded from it */
  raw: string;
  /** recovered from the signature by the node */
  from: string;
  to: string;
  value: string;
  gasPrice: string;
  gasLimit: string;
  nonce: number;
  data: string;
  chainId: number;
}

export interface BlockType {
  number: number;
  timestamp: number;
  previousHash: string;
  /** Merkle root of the transaction hashes */
  transactionsRoot: string;
  /** leading zero hex digits the hash had to have */
  difficulty: number;
  data: string;
  nonce: string;
  hash: string;
  gasUsed: string;
  transactions: string[];
  transactionsDetailed: EthereumTransaction[];
}
