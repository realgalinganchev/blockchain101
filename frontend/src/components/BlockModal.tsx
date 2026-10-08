import React, { useEffect, useMemo, useState } from "react";
import { utils } from "ethers";
import Modal from "./Modal";
import HashText from "./HashText";
import CopyButton from "./CopyButton";
import TxDetails from "./TxDetails";
import { timeAgo } from "./BlockView";
import { BlockType, EthereumTransaction } from "../types/block";
import { checksum, formatEth, leadingZeros, sumValues, toBigNumber } from "../utils/format";
import { verifyBlock } from "../utils/verify";

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
          <HashText hash={checksum(tx.to)} head={4} tail={4} zeros={false} />
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

/** A copy of the block with one change an attacker might make; it never leaves the browser. */
function tamperWith(block: BlockType): { copy: BlockType; change: string; consequence: string } {
  const copy: BlockType = JSON.parse(JSON.stringify(block));
  if (copy.transactionsDetailed.length > 0) {
    copy.transactionsDetailed[0].value = utils.parseEther("1000").toString();
    return {
      copy,
      change: "transaction 1 now sends 1,000 ETH",
      consequence:
        "That breaks its signature, and only the sender's private key could sign a new one. Swapping in a different signed transaction changes its hash instead, so the transactions root, the block hash and its proof of work break",
    };
  }
  copy.timestamp -= 60_000;
  return {
    copy,
    change: "the timestamp is a minute earlier",
    consequence: "The header no longer hashes to the stored hash. Storing the new hash instead throws away the proof of work",
  };
}

const BlockModal: React.FC<BlockModalProps> = ({ blocks, index, onNavigate, onClose }) => {
  const real = blocks[index];
  const parent = blocks[index - 1];
  const hasPrev = index > 0;
  const hasNext = index < blocks.length - 1;
  const [tampered, setTampered] = useState(false);

  useEffect(() => setTampered(false), [index]);

  // ← / → step through the chain while the modal is open
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft" && hasPrev) onNavigate(index - 1);
      if (event.key === "ArrowRight" && hasNext) onNavigate(index + 1);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [index, hasPrev, hasNext, onNavigate]);

  const tamper = useMemo(() => (real ? tamperWith(real) : null), [real]);
  const block = tampered && tamper ? tamper.copy : real;
  const checks = useMemo(() => (block ? verifyBlock(block, parent) : []), [block, parent]);

  if (!block) return null;

  const isGenesis = index === 0;
  const txs = block.transactionsDetailed ?? [];
  const nonce = parseInt(block.nonce, 16);
  const zeros = leadingZeros(block.hash);
  const allOk = checks.every((check) => check.ok);
  const gasUsed = toBigNumber(block.gasUsed);

  return (
    <Modal
      onClose={onClose}
      title={
        <>
          Block <span className="mono">#{index}</span>
          {isGenesis && <span className="badge">genesis</span>}
          {tampered && <span className="badge badge--bad">tampered copy</span>}
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
          <dt>Transactions root</dt>
          <dd>
            <HashText hash={block.transactionsRoot} full zeros={false} />
            <span className="muted small">Merkle root of the transaction hashes, so the block hash covers every transaction</span>
          </dd>
        </div>
        <div>
          <dt>Mined</dt>
          <dd>
            {new Date(block.timestamp).toLocaleString()} <span className="muted">({timeAgo(block.timestamp)})</span>
          </dd>
        </div>
        <div>
          <dt>Proof of work</dt>
          <dd>
            {isGenesis ? (
              <span className="muted">not mined: the genesis block is created, not found</span>
            ) : (
              <>
                target <strong className="zero">{block.difficulty} zero{block.difficulty === 1 ? "" : "s"}</strong>
                <span className="muted">
                  (≈ {Math.pow(16, block.difficulty).toLocaleString()} attempts on average); the hash has {zeros}
                </span>
              </>
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
          <dt>Transactions</dt>
          <dd className="mono">
            {txs.length}
            {txs.length > 0 && (
              <span className="muted">
                {" "}
                · {formatEth(sumValues(txs))} moved · gas used{" "}
                {gasUsed ? gasUsed.toNumber().toLocaleString() : "—"}
              </span>
            )}
          </dd>
        </div>
        {block.data && (
          <div>
            <dt>Data</dt>
            <dd>{block.data}</dd>
          </div>
        )}
      </dl>

      <h3 className="modal__section">
        Verified in your browser{" "}
        <span className={`check ${allOk ? "check--ok" : "check--bad"}`}>{allOk ? "✓ valid" : "✗ invalid"}</span>
      </h3>
      <ul className="checks">
        {checks.map((check) => (
          <li key={check.label} className={check.ok ? "is-ok" : "is-bad"}>
            <span className="checks__mark" aria-hidden>
              {check.ok ? "✓" : "✗"}
            </span>
            <span>
              <strong>{check.label}</strong> <span className="muted">{check.detail}</span>
            </span>
          </li>
        ))}
      </ul>

      {tamper && (
        <div className={`tamper${tampered ? " is-on" : ""}`}>
          {tampered ? (
            <p>
              In this copy, {tamper.change}. {tamper.consequence}
              {hasNext ? `, and block #${index + 1}'s link to this block breaks too` : ""}. To get away with it, an attacker
              would have to redo the proof of work for this block and every block after it.
            </p>
          ) : (
            <p>What if someone edits this block after it was mined? Try it on a copy (nothing is sent to the node).</p>
          )}
          <button type="button" className="btn btn--secondary tamper__btn" onClick={() => setTampered(!tampered)}>
            {tampered ? "↺ Undo" : "Tamper with this block"}
          </button>
        </div>
      )}

      {hasNext && !tampered && (
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
        <ul className="tx-rows" key={`${block.hash}-${tampered}`}>
          {txs.map((tx, i) => (
            <TxRow key={tx.hash ?? i} tx={tx} position={i + 1} blockHeight={index} defaultOpen={txs.length === 1 || (tampered && i === 0)} />
          ))}
        </ul>
      )}
    </Modal>
  );
};

export default BlockModal;
