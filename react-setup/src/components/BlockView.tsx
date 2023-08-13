import React from "react";
import "../styles/App.css";
import { formatHash } from "../utils/crypto";
import { BlockType, EthereumTransaction } from "../types/block";

interface BlockViewProps {
  block: BlockType;
  isCompactView: boolean;
  index: number;
}

const BlockView: React.FC<BlockViewProps> = ({
  block,
  isCompactView,
  index,
}) => {
  const transactions = block.transactionsDetailed;
  return (
    <div className="Block">
      <h5 className="gameFont">Block height:{index + 1}</h5>
      <p>Nonce: {parseInt(block.nonce, 16)}</p>
      <p>Hash: {formatHash(block.hash)}</p>
      <p>Data: {block.data}</p>
      <p>{` Parent Hash: ${
        index === 0 ? "0" : formatHash(block.previousHash)
      }`}</p>
      <div>
        {transactions &&
          transactions
            .filter((_: any, i: number) => {
              if (isCompactView && block.transactions.length > 2) {
                return i === 0 || i === block.transactions.length - 1;
              }
              return true;
            })
            .map((tx: EthereumTransaction, i: number) => (
              <React.Fragment key={i}>
                <div className="Transaction">
                  <span>
                    (
                    {block.transactionsDetailed &&
                      block.transactionsDetailed.indexOf(tx) + 1}
                    )Tx hash:
                    {tx.hash && formatHash(tx.hash)}
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
