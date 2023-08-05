export interface TransactionType {
  id: string;
  timestamp: number;
  input: {
    publicKey: Uint8Array;
    amount: number;
    signature: string;
  };
  output: {
    publicKey: Uint8Array;
    amount: number;
  };
}

export interface BlockType {
  id: number;
  nonce: number;
  hash: string;
  transactions: TransactionType[];
  data: string;
  timestamp:number;
  previousHash: string;
  toHash: () => string;
  toObject: () => any;
}
