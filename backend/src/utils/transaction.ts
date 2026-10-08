import { BigNumber, utils } from "ethers";
import { CHAIN_ID, MAX_RAW_TX_BYTES, TRANSFER_GAS } from "../constants/tx";
import { EthereumTransaction } from "../types/block";

/** A transaction the node refuses; `status` is the HTTP status the API answers with. */
export class TransactionError extends Error {
  constructor(message: string, readonly status = 400) {
    super(message);
  }
}

/**
 * Decodes a raw signed transaction and checks it the way a node does before letting it
 * into the mempool. The sender is recovered from the signature (v, r, s), so nobody can
 * submit a transaction on behalf of an address whose private key they don't hold.
 */
export function decodeSignedTransaction(raw: unknown): EthereumTransaction {
  if (typeof raw !== "string" || !utils.isHexString(raw)) {
    throw new TransactionError("Send the signed transaction as a 0x-prefixed hex string in `raw`.");
  }
  if (utils.hexDataLength(raw) > MAX_RAW_TX_BYTES) {
    throw new TransactionError(`The transaction is larger than ${MAX_RAW_TX_BYTES} bytes.`);
  }

  let tx: ReturnType<typeof utils.parseTransaction>;
  try {
    tx = utils.parseTransaction(raw);
  } catch {
    throw new TransactionError("Not a valid RLP-encoded transaction.");
  }

  if (tx.type) throw new TransactionError("Only legacy (type 0) transactions are supported.");
  if (!tx.from || !tx.hash) throw new TransactionError("The transaction is not signed.");
  if (tx.chainId !== CHAIN_ID) {
    throw new TransactionError(`Signed for chain ${tx.chainId}, but this chain's id is ${CHAIN_ID} (EIP-155 replay protection).`);
  }
  if (!tx.to) throw new TransactionError("Contract creation is not supported: set a recipient.");
  if (tx.gasLimit.lt(TRANSFER_GAS)) {
    throw new TransactionError(`Gas limit ${tx.gasLimit} is below ${TRANSFER_GAS}, the cost of a plain transfer.`);
  }

  return {
    hash: tx.hash,
    id: tx.hash,
    raw,
    from: tx.from,
    to: tx.to,
    value: tx.value.toString(),
    gasPrice: (tx.gasPrice ?? BigNumber.from(0)).toString(),
    gasLimit: tx.gasLimit.toString(),
    nonce: tx.nonce,
    data: tx.data,
    chainId: tx.chainId,
  };
}

/** Re-decodes the signed bytes and returns a problem if any stored field disagrees with them. */
export function checkTransaction(tx: EthereumTransaction): string | null {
  let decoded: EthereumTransaction;
  try {
    decoded = decodeSignedTransaction(tx.raw);
  } catch (error: any) {
    return error.message;
  }
  const fields: (keyof EthereumTransaction)[] = ["hash", "from", "to", "value", "gasPrice", "gasLimit", "nonce", "data", "chainId"];
  const changed = fields.filter((field) => String(decoded[field]).toLowerCase() !== String(tx[field]).toLowerCase());
  return changed.length ? `${changed.join(", ")} ${changed.length === 1 ? "does" : "do"} not match what the sender signed` : null;
}

export function totalGas(transactions: EthereumTransaction[]): string {
  return transactions.reduce((sum, tx) => sum.add(tx.gasLimit), BigNumber.from(0)).toString();
}
