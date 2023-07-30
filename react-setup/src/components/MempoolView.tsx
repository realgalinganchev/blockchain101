import React from "react";
import { Transaction } from "./types/block";

interface MempoolViewProps {
  mempool: Transaction[];
}

const MempoolView: React.FC<MempoolViewProps> = ({ mempool }) => {
  return (
    <div>
      <h2>Mempool</h2>
      {mempool.map((transaction, index) => (
        <div key={index}>
          <p>Transaction ID: {transaction.id}</p>
          <p>Transaction timestamp: {transaction.timestamp}</p>
        </div>
      ))}
    </div>
  );
};

export default MempoolView;
