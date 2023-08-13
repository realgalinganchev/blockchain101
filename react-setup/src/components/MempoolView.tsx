import React from "react";
import { EthereumTransaction } from "../types/block";
import "../styles/App.css";
import { formatHash } from "../utils/calc";

interface MempoolViewProps {
  mempool: EthereumTransaction[];
  isLoading: boolean;
}

const MempoolView: React.FC<MempoolViewProps> = ({ mempool, isLoading }) => {
  return (
    <div className="Mempool">
      <h2 className="gameFont">Mempool</h2>
      <div className="TransactionList">
        {mempool.length === 0 && !isLoading ? (
          <div className="EmptyContainer">No transactions in the mempool</div>
        ) : (
          <>
            {mempool.map((tx, i) => (
              <div className="Transaction" key={i}>
                {/* Nr for visual purposes only */}
                <span>Tx Nr: {i + 1}</span>
                <span>from: {tx.from && formatHash(tx.from)}</span>
                <span>to: {tx.to && formatHash(tx.to)}</span>
                <span>status: pending</span>
              </div>
            ))}
            {isLoading && <div className="loader"></div>}
          </>
        )}
      </div>
    </div>
  );
};

export default MempoolView;
