import React from "react";
import { EthereumTransaction } from "./types/block";
import "./styles/App.css";
import { formatHash } from "../utils/crypto";

interface MempoolViewProps {
  mempool: EthereumTransaction[];
}

const MempoolView: React.FC<MempoolViewProps> = ({ mempool }) => {
  return (
    <div className="Mempool">
      <h2>Mempool</h2>
      <div className="TransactionList">
        {mempool.map((tx, i) => (
          <div className="Transaction" key={i}>
            {/* Nr for visual purposes only */}
            <p>Tx Nr.: {i + 1}</p>
            <p>from: {tx.from && formatHash(tx.from)}</p>
            <p>to: {tx.to && formatHash(tx.to)}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MempoolView;
