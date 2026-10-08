import React from "react";
import HashText from "./HashText";
import { EthereumTransaction } from "../types/block";
import { checksum, formatEth } from "../utils/format";

interface MempoolViewProps {
  mempool: EthereumTransaction[];
  isLoading: boolean;
  onOpen: (tx: EthereumTransaction) => void;
}

const MempoolView: React.FC<MempoolViewProps> = ({ mempool, isLoading, onOpen }) => (
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
          <li key={tx.hash ?? i}>
            <button type="button" className="tx tx--button" onClick={() => onOpen(tx)} aria-label={`Open pending transaction ${i + 1}`}>
              <span className="tx__index">{i + 1}</span>
              <HashText hash={checksum(tx.from)} head={6} tail={4} zeros={false} />
              <span className="tx__arrow">→</span>
              <HashText hash={checksum(tx.to)} head={6} tail={4} zeros={false} />
              <span className="tx__value">{formatEth(tx.value)}</span>
              <span className="pill pill--pending">pending</span>
            </button>
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
