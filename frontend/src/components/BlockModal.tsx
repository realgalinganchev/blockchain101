import React, { useEffect, useState } from "react";
import Modal from "./Modal";
import HashText from "./HashText";
import CopyButton from "./CopyButton";
import TxDetails from "./TxDetails";
import { timeAgo } from "./BlockView";
import { BlockType, EthereumTransaction } from "../types/block";
import { checksum, formatEth, leadingZeros, sumGas, sumValues } from "../utils/format";

interface BlockModalProps {
  /** the whole chain, oldest first; the index is the block height */
  blocks: BlockType[];
  index: number;
  onNavigate: (index: number) => void;
  onClose: () => void;
}

const TxRow: React.FC<{ tx: EthereumTransaction; position: number; blockHeight: number; defaultOpen: boolean }> = ({
  tx,
  position,
  blockHeight,
  defaultOpen,
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <li className={`tx-row${open ? " is-open" : ""}`}>
      <button type="button" className="tx-row__head" aria-expanded={open} onClick={() => setOpen(!open)}>
        <span className="tx__index">{position}</span>
        <span className="tx-row__route">
          <HashText hash={checksum(tx.from)} head={4} tail={4} zeros={false} />
          <span className="tx__arrow">→</span>
          <HashText hash={checksum(tx.to as string | undefined)} head={4} tail={4} zeros={false} />
        </span>
        <span className="tx-row__value">{formatEth(tx.value)}</span>
        <span className="chevron" aria-hidden>
          ▾
        </span>
      </button>
      {open && (
        <div className="tx-row__body">
          <TxDetails tx={tx} blockHeight={blockHeight} />
        </div>
      )}
    </li>
  );
};

const BlockModal: React.FC<BlockModalProps> = ({ blocks, index, onNavigate, onClose }) => {
  const block = blocks[index];
  const hasPrev = index > 0;
  const hasNext = index < blocks.length - 1;

  // ← / → step through the chain while the modal is open
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft" && hasPrev) onNavigate(index - 1);
      if (event.key === "ArrowRight" && hasNext) onNavigate(index + 1);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [index, hasPrev, hasNext, onNavigate]);

  if (!block) return null;

  const isGenesis = index === 0;
  const txs = block.transactionsDetailed ?? [];
  const nonce = parseInt(block.nonce, 16);
  const zeros = leadingZeros(block.hash);

  return (
    <Modal
      onClose={onClose}
      title={
        <>
          Block <span className="mono">#{index}</span>
          {isGenesis && <span className="badge">genesis</span>}
        </>
      }
      actions={
        <>
          <button type="button" className="icon-btn" onClick={() => onNavigate(index - 1)} disabled={!hasPrev} aria-label="Previous block">
            ‹
          </button>
          <button type="button" className="icon-btn" onClick={() => onNavigate(index + 1)} disabled={!hasNext} aria-label="Next block">
            ›
          </button>
        </>
      }
    >
      <dl className="kv">
        <div>
          <dt>Block hash</dt>
          <dd>
            <HashText hash={block.hash} full />
            <CopyButton value={block.hash} label="Copy block hash" />
          </dd>
        </div>
        <div>
          <dt>Parent hash</dt>
          <dd>
            {isGenesis ? (
              <span className="muted">none: the genesis block starts the chain</span>
            ) : (
              <>
                <HashText hash={block.previousHash} full />
                <button type="button" className="chip" onClick={() => onNavigate(index - 1)}>
                  block #{index - 1}
                </button>
              </>
            )}
          </dd>
        </div>
        <div>
          <dt>Mined</dt>
          <dd>
            {block.timestamp ? (
              <>
                {new Date(block.timestamp).toLocaleString()} <span className="muted">({timeAgo(block.timestamp)})</span>
              </>
            ) : (
              "—"
            )}
          </dd>
        </div>
        <div>
          <dt>Nonce</dt>
          <dd className="mono">
            {Number.isNaN(nonce) ? "—" : nonce.toLocaleString()} <span className="muted">({block.nonce})</span>
          </dd>
        </div>
        <div>
          <dt>Proof of work</dt>
          <dd>
            {isGenesis ? (
              <span className="muted">not mined: the genesis block is created, not found</span>
            ) : (
              <>
                hash starts with <strong className="zero">{zeros} zero{zeros === 1 ? "" : "s"}</strong>
                <span className="muted"> (the miner tried nonces until it did)</span>
              </>
            )}
          </dd>
        </div>
        <div>
          <dt>Transactions</dt>
          <dd className="mono">{txs.length}</dd>
        </div>
        {txs.length > 0 && (
          <>
            <div>
              <dt>Total value</dt>
              <dd className="mono">{formatEth(sumValues(txs))}</dd>
            </div>
            <div>
              <dt>Gas used</dt>
              <dd className="mono">{sumGas(txs).toNumber().toLocaleString()}</dd>
            </div>
          </>
        )}
        {block.data && (
          <div>
            <dt>Data</dt>
            <dd>{block.data}</dd>
          </div>
        )}
      </dl>

      {hasNext && (
        <p className="note">
          Block #{index + 1} stores this block's hash as its parent hash. That link is what makes it a chain.
        </p>
      )}

      <h3 className="modal__section">
        Transactions <span className="muted">({txs.length})</span>
      </h3>
      {txs.length === 0 ? (
        <p className="muted">
          {isGenesis ? "The genesis block carries no transactions." : "An empty block: the mempool was empty when it was mined."}
        </p>
      ) : (
        <ul className="tx-rows" key={block.hash}>
          {txs.map((tx, i) => (
            <TxRow key={tx.id ?? tx.hash ?? i} tx={tx} position={i + 1} blockHeight={index} defaultOpen={txs.length === 1} />
          ))}
        </ul>
      )}
    </Modal>
  );
};

export default BlockModal;
