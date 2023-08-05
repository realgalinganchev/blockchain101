import React from "react";
import { EthereumTransaction } from "./types/block";
import "./styles/App.css";
import { getAddress } from "../utils/crypto";

interface MempoolViewProps {
  mempool: EthereumTransaction[];
}

const MempoolView: React.FC<MempoolViewProps> = ({ mempool }) => {
  console.log("mempool :>> ", mempool);
  return (
    <div className="Mempool">
      <h2>Mempool</h2>
      <div className="TransactionList">
        {mempool.map((transaction, index) => (
          <div className="Transaction" key={index}>
            <p>tx Nr.: {index + 1}</p>
            <p>from: {transaction.from}</p>
            <p>to: {transaction.to?.toString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MempoolView;
