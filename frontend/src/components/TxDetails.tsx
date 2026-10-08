import React from "react";
import HashText from "./HashText";
import CopyButton from "./CopyButton";
import { EthereumTransaction } from "../types/block";
import { checksum, formatEth, formatGwei, maxFee, toBigNumber } from "../utils/format";
import { checkTransaction } from "../utils/verify";

interface TxDetailsProps {
  tx: EthereumTransaction;
  /** height of the block that includes it; undefined while it waits in the mempool */
  blockHeight?: number;
}

const TxDetails: React.FC<TxDetailsProps> = ({ tx, blockHeight }) => {
  const from = checksum(tx.from);
  const to = checksum(tx.to);
  const gasLimit = toBigNumber(tx.gasLimit);
  const signatureProblem = checkTransaction(tx);

  return (
    <dl className="kv">
      <div>
        <dt>Tx hash</dt>
        <dd>
          <HashText hash={tx.hash} full zeros={false} />
          <CopyButton value={tx.hash} label="Copy tx hash" />
        </dd>
      </div>
      <div>
        <dt>Status</dt>
        <dd>
          {blockHeight === undefined ? (
            <span className="pill pill--pending">pending in the mempool</span>
          ) : (
            <span className="pill pill--ok">included in block #{blockHeight}</span>
          )}
        </dd>
      </div>
      <div>
        <dt>From</dt>
        <dd>
          <HashText hash={from} full zeros={false} />
          <CopyButton value={from} label="Copy sender" />
        </dd>
      </div>
      <div>
        <dt>To</dt>
        <dd>
          <HashText hash={to} full zeros={false} />
          <CopyButton value={to} label="Copy recipient" />
        </dd>
      </div>
      <div>
        <dt>Value</dt>
        <dd className="mono strong">{formatEth(tx.value, 6)}</dd>
      </div>
      <div>
        <dt>Signature</dt>
        <dd>
          {signatureProblem ? (
            <span className="check check--bad">✗ {signatureProblem}</span>
          ) : (
            <span className="check check--ok">
              ✓ valid <span className="muted">(checked in your browser: the sender is recovered from the signature)</span>
            </span>
          )}
        </dd>
      </div>
      <div>
        <dt>Gas price</dt>
        <dd className="mono">{formatGwei(tx.gasPrice)}</dd>
      </div>
      <div>
        <dt>Gas limit</dt>
        <dd className="mono">{gasLimit ? gasLimit.toNumber().toLocaleString() : "—"}</dd>
      </div>
      <div>
        <dt>Max fee</dt>
        <dd className="mono">
          {formatEth(maxFee(tx), 8)} <span className="muted">(gas price × gas limit)</span>
        </dd>
      </div>
      <div>
        <dt>Sender nonce</dt>
        <dd className="mono">
          {tx.nonce} <span className="muted">(how many transactions the sender sent before this one)</span>
        </dd>
      </div>
      <div>
        <dt>Chain id</dt>
        <dd className="mono">
          {tx.chainId} <span className="muted">(signed in, so the signature is useless on other chains: EIP-155)</span>
        </dd>
      </div>
      <div>
        <dt>Data</dt>
        <dd className="mono">
          {!tx.data || tx.data === "0x" ? (
            <>
              0x <span className="muted">(empty: a plain ETH transfer)</span>
            </>
          ) : (
            <span className="hash hash--full">{tx.data}</span>
          )}
        </dd>
      </div>
      <div>
        <dt>Signed bytes</dt>
        <dd>
          <HashText hash={tx.raw} head={16} tail={8} zeros={false} />
          <CopyButton value={tx.raw} label="Copy raw signed transaction" />
          <span className="muted small">{tx.raw ? `${(tx.raw.length - 2) / 2} bytes, RLP-encoded` : ""}</span>
        </dd>
      </div>
    </dl>
  );
};

export default TxDetails;
