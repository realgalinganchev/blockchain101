import React from "react";
import HashText from "./HashText";
import { BlockType } from "../types/block";
import { checksum, formatEth } from "../utils/format";

interface BlockViewProps {
  block: BlockType;
  index: number;
  onOpen: () => void;
  /** just mined in this tab: briefly highlighted */
  isNew?: boolean;
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

const BlockView: React.FC<BlockViewProps> = ({ block, index, onOpen, isNew = false }) => {
  const txs = block.transactionsDetailed ?? [];
  const isGenesis = index === 0;

  return (
    <article className={`block block--clickable${isGenesis ? " block--genesis" : ""}${isNew ? " block--new" : ""}`}>
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
            <li key={tx.id ?? tx.hash ?? i}>
              <span className="block__tx-route">
                <HashText hash={checksum(tx.from)} head={4} tail={4} zeros={false} />
                <span className="tx__arrow">→</span>
                <HashText hash={checksum(tx.to as string | undefined)} head={4} tail={4} zeros={false} />
              </span>
              <span className="block__tx-value">{formatEth(tx.value)}</span>
            </li>
          ))}
          {txs.length > MAX_TX_SHOWN && (
            <li className="muted">+{txs.length - MAX_TX_SHOWN} more</li>
          )}
        </ul>
      )}

      {/* stretched over the whole card, so the card is one big, keyboard-reachable button */}
      <button type="button" className="block__open" onClick={onOpen} aria-label={`Open block #${index}: ${txs.length} transaction${txs.length === 1 ? "" : "s"}`}>
        View details <span aria-hidden>→</span>
      </button>
    </article>
  );
};

export default BlockView;
