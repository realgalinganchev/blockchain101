import React from "react";
import { BlockType, EthereumTransaction } from "./types/block";
import "./styles/App.css";

interface BlockViewProps {
  block: BlockType;
  isCompactView: boolean;
}

const BlockView: React.FC<BlockViewProps> = ({ block, isCompactView }) => {
  return (
    <div className="Block">
      <h3>Block ID: {block.id}</h3>
      <p>Nonce: {block.nonce}</p>
      <p>Hash: ...{block.hash.slice(-4)}</p>
      <p>Data: {block.data}</p>
      <p>Previous Hash: ...{block.previousHash.slice(-4)}</p>
      <div>
        {block.transactions
          .filter((_, i: number) => {
            if (isCompactView && block.transactions.length > 2) {
              return i === 0 || i === block.transactions.length - 1;
            }
            return true;
          })
          .map((tx: EthereumTransaction, i: number) => (
            <React.Fragment key={i}>
              <div className="Transaction">
                <span>
                  Tx({block.transactions.indexOf(tx) + 1})
                  Tx hash: 0x..{tx.hash?.slice(-3)}
                </span>
              </div>
              {isCompactView && i === 0 && block.transactions.length > 2 && (
                <div>...</div>
              )}
            </React.Fragment>
          ))}
      </div>
    </div>
  );
};

export default BlockView;
