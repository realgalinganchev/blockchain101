import React from "react";
import HashText from "./HashText";
import CopyButton from "./CopyButton";
import { EthereumTransaction } from "../types/block";
import { checksum, formatEth, formatGwei, maxFee, toBigNumber } from "../utils/format";

interface TxDetailsProps {
  tx: EthereumTransaction;
  /** height of the block that includes it; undefined while it waits in the mempool */
  blockHeight?: number;
}

const TxDetails: React.FC<TxDetailsProps> = ({ tx, blockHeight }) => {
  // `id` is keccak256 of the signed transaction (its Ethereum hash). The pre-mined
  // demo transactions only have a random id, so fall back to the node's hash for them.
  const txHash = /^0x[0-9a-f]{64}$/i.test(tx.id ?? "") ? tx.id : tx.hash;
  const from = checksum(tx.from);
  const to = checksum(tx.to as string | undefined);
  const gasLimit = toBigNumber(tx.gasLimit);
  const data = typeof tx.data === "string" ? tx.data : undefined;

  return (
    <dl className="kv">
      <div>
        <dt>Tx hash</dt>
        <dd>
          <HashText hash={txHash} full zeros={false} />
          <CopyButton value={txHash} label="Copy tx hash" />
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
        <dd className="mono">{tx.nonce !== undefined ? String(toBigNumber(tx.nonce) ?? tx.nonce) : "—"}</dd>
      </div>
      <div>
        <dt>Data</dt>
        <dd className="mono">
          {!data || data === "0x" ? (
            <>
              0x <span className="muted">(empty: a plain ETH transfer)</span>
            </>
          ) : (
            <span className="hash hash--full">{data}</span>
          )}
        </dd>
      </div>
    </dl>
  );
};

export default TxDetails;
