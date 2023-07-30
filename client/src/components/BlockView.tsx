import React from "react";

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

interface Block {
  id: number;
  nonce: number;
  hash: string;
  transactions: Transaction[];
}

interface BlockViewProps {
  block: Block;
}

const BlockView: React.FC<BlockViewProps> = ({ block }) => {
  return (
    <div>
      <h2>Block #{block.id}</h2>
      <p>Nonce: {block.nonce}</p>
      <p>Hash: {block.hash}</p>
      <h3>Transactions:</h3>
      {block.transactions.map((tx, index) => (
        <p key={index}>
          Tx {tx.id} from {tx.input.address} to {tx.output.address} for {tx.output.amount}     
        </p>
      ))}
    </div>
  );
};

export default BlockView;
