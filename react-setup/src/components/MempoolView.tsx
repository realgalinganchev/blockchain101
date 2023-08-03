import React from "react";
import { TransactionType } from "./types/block";
import "./styles/App.css";

interface MempoolViewProps {
  mempool: TransactionType[];
}

const MempoolView: React.FC<MempoolViewProps> = ({ mempool }) => {
  return (
    <div className="Mempool">
      <h2>Mempool</h2>
      <div className="TransactionList">
        {mempool.map((transaction, index) => (
          <div className="Transaction" key={index}>
            <p>tx Nr.: {index + 1}</p>
            <p>tx ID: {transaction.id}</p>
            <p>timestamp: {transaction.timestamp}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MempoolView;
