import React from "react";
import HashText from "./HashText";
import { BlockType } from "../types/block";

interface BlockViewProps {
  block: BlockType;
  index: number;
}

const MAX_TX_SHOWN = 3;

export const timeAgo = (ms: number): string => {
  const s = Math.max(0, Math.round((Date.now() - ms) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 48) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
};

const BlockView: React.FC<BlockViewProps> = ({ block, index }) => {
  const txs = block.transactionsDetailed ?? [];
  const isGenesis = index === 0;

  return (
    <article className={`block${isGenesis ? " block--genesis" : ""}`}>
      <header className="block__head">
        <span className="block__height">#{index}</span>
        {isGenesis && <span className="badge">genesis</span>}
        {block.timestamp ? (
          <time className="block__time" title={new Date(block.timestamp).toLocaleString()}>
            {timeAgo(block.timestamp)}
          </time>
        ) : null}
      </header>

      <dl className="block__fields">
        <div>
          <dt>Hash</dt>
          <dd><HashText hash={block.hash} /></dd>
        </div>
        <div>
          <dt>Parent</dt>
          <dd>{isGenesis ? <span className="muted">none</span> : <HashText hash={block.previousHash} />}</dd>
        </div>
        <div>
          <dt>Nonce</dt>
          <dd className="mono">{parseInt(block.nonce, 16).toLocaleString()}</dd>
        </div>
        <div>
          <dt>Txs</dt>
          <dd className="mono">{txs.length}</dd>
        </div>
      </dl>

      {txs.length > 0 && (
        <ul className="block__txs">
          {txs.slice(0, MAX_TX_SHOWN).map((tx, i) => (
            <li key={tx.hash ?? i}>
              <HashText hash={tx.hash} head={8} tail={4} />
            </li>
          ))}
          {txs.length > MAX_TX_SHOWN && (
            <li className="muted">+{txs.length - MAX_TX_SHOWN} more</li>
          )}
        </ul>
      )}
    </article>
  );
};

export default BlockView;
