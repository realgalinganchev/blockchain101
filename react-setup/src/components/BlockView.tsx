import React from "react";
import BlockClass from "./BlockClass"; // Import the BlockClass

interface BlockViewProps {
  block: BlockClass; // Use BlockClass as the type
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
      {block.transactions?.map((tx, index) => (
        <p key={index}>
          Tx {tx.id} from {tx.input.address} to {tx.output.address} for {tx.output.amount}
        </p>
      ))}
    </div>
  );
};

export default BlockView;
