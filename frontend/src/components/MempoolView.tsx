import React from "react";
import HashText from "./HashText";
import { EthereumTransaction } from "../types/block";

interface MempoolViewProps {
  mempool: EthereumTransaction[];
  isLoading: boolean;
}

const MempoolView: React.FC<MempoolViewProps> = ({ mempool, isLoading }) => (
  <section className="card mempool">
    <header className="card__head">
      <h2>Mempool</h2>
      <span className="count">{mempool.length} pending</span>
    </header>

    {mempool.length === 0 && !isLoading ? (
      <div className="empty">
        <p>No pending transactions.</p>
        <p className="muted">Add one, then mine a block to include it in the chain.</p>
      </div>
    ) : (
      <ul className="tx-list">
        {mempool.map((tx, i) => (
          <li className="tx" key={tx.id ?? i}>
            <span className="tx__index">{i + 1}</span>
            <HashText hash={tx.from} head={6} tail={4} />
            <span className="tx__arrow">→</span>
            <HashText hash={tx.to as string} head={6} tail={4} />
            <span className="pill pill--pending">pending</span>
          </li>
        ))}
        {isLoading && (
          <li className="tx tx--loading">
            <span className="spinner" /> Signing transaction…
          </li>
        )}
      </ul>
    )}
  </section>
);

export default MempoolView;
