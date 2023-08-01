import React from "react";
import { Block } from "./types/block";
import "./styles/App.css";

interface BlockViewProps {
  block: Block;
}

const BlockView: React.FC<BlockViewProps> = ({ block }) => {
  return (
    <div className="Block">
      <h3>Block ID: {block.id}</h3>
      <p>Nonce: {block.nonce}</p>
      <p>Hash: ...{block.hash.slice(-4)}</p>
      <p>Data: {block.data}</p>
      <p>Previous Hash: ...{block.previousHash.slice(-4)}</p>
      {block.transactions.map((transaction, index) => (
        <div className="Transaction" key={index}>
          <span>
            Tx({index + 1}) ID: ...{transaction.id.slice(-4)}
          </span>
          <span>Tx timestamp: {transaction.timestamp}</span>
        </div>
      ))}
    </div>
  );
};

export default BlockView;
