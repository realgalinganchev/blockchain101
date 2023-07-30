import React from "react";
import { Block } from "./types/block";

interface BlockViewProps {
  block: Block;
}

const BlockView: React.FC<BlockViewProps> = ({ block }) => {
  return (
    <div>
      <h2>Block #{block.id}</h2>
      <p>Nonce: {block.nonce}</p>
      <p>Hash: {block.hash}</p>
      <p>Previous hash: {block.previousHash}</p>
      <p>Data: {block.data}</p>
      <h3>Transactions:</h3>
      {block.transactions?.map((tx) => (
        <div key={tx.id}>
          <p>Transaction ID: {tx.id}</p>
          {/* Add other transaction details as needed */}
        </div>
      ))}
    </div>
  );
};

export default BlockView;
