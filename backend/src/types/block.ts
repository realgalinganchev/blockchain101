/**
 * A signed transaction as the node keeps it: the raw bytes the wallet signed, plus the
 * fields decoded from them. `from` is recovered from the signature, never taken from
 * the request. Amounts are wei as decimal strings.
 */
export interface EthereumTransaction {
  /** keccak256(raw): the Ethereum transaction hash. Also the storage id. */
  hash: string;
  id: string;
  raw: string;
  from: string;
  to: string;
  value: string;
  gasPrice: string;
  gasLimit: string;
  nonce: number;
  data: string;
  chainId: number;
}

/** The fields the proof of work covers (everything except the nonce, see utils/hash.ts). */
export interface BlockHeader {
  number: number;
  timestamp: number;
  previousHash: string;
  /** Merkle root of the transaction hashes, so the block hash commits to every transaction. */
  transactionsRoot: string;
  /** Leading zero hex digits the hash must have. */
  difficulty: number;
  data: string;
}

/** A block as stored and served by the API. */
export interface StoredBlock extends BlockHeader {
  nonce: string;
  hash: string;
  gasUsed: string;
  transactions: string[];
  transactionsDetailed: EthereumTransaction[];
}
