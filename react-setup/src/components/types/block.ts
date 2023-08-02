export interface TransactionType {
  id: string;
  timestamp: number;
  input: {
    address: string;
    amount: number;
    signature: string;
  };
  output: {
    address: string;
    amount: number;
  };
}

export interface BlockType {
  id: number;
  nonce: number;
  hash: string;
  transactions: TransactionType[];
  data: string;
  previousHash: string;
  toHash: () => string;
}
