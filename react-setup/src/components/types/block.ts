export interface Transaction {
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

export interface Block {
  id?: number;
  nonce?: number;
  hash?: string;
  transactions?: Transaction[];
  data: any;
  previousHash: string;
  toHash: any;
}
