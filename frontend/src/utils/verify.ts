import { constants, utils } from "ethers";
import { BlockType, EthereumTransaction } from "../types/block";

// The node's rules, re-implemented so the browser checks the chain itself instead of
// trusting the API (backend/src/utils/hash.ts and validate.ts).

export function merkleRoot(hashes: string[]): string {
  if (hashes.length === 0) return constants.HashZero;
  let level = hashes;
  while (level.length > 1) {
    const next: string[] = [];
    for (let i = 0; i < level.length; i += 2) {
      next.push(utils.keccak256(utils.concat([level[i], level[i + 1] ?? level[i]])));
    }
    level = next;
  }
  return level[0];
}

export function blockHash(block: BlockType): string {
  try {
    return hashHeader(block);
  } catch {
    return ""; // malformed header fields: can't match any hash
  }
}

function hashHeader(block: BlockType): string {
  const seal = utils.keccak256(
    utils.defaultAbiCoder.encode(
      ["uint256", "uint256", "string", "bytes32", "uint8", "string"],
      [block.number, block.timestamp, block.previousHash, block.transactionsRoot, block.difficulty, block.data]
    )
  );
  return utils.keccak256(utils.concat([seal, utils.hexZeroPad(block.nonce, 32)]));
}

/** null when the stored fields are exactly what the sender signed; otherwise what's wrong. */
const txCache = new Map<string, string | null>();
export function checkTransaction(tx: EthereumTransaction): string | null {
  const key = JSON.stringify(tx);
  if (!txCache.has(key)) txCache.set(key, computeTxProblem(tx));
  return txCache.get(key) ?? null;
}

function computeTxProblem(tx: EthereumTransaction): string | null {
  try {
    const signed = utils.parseTransaction(tx.raw);
    if (!signed.from) return "not signed";
    if (signed.hash !== tx.hash) return "the hash isn't keccak256 of the signed bytes";
    if (signed.from.toLowerCase() !== tx.from.toLowerCase()) return "the sender doesn't match the signature";
    const same =
      signed.to?.toLowerCase() === tx.to.toLowerCase() &&
      signed.value.toString() === tx.value &&
      (signed.gasPrice?.toString() ?? "0") === tx.gasPrice &&
      signed.gasLimit.toString() === tx.gasLimit &&
      signed.nonce === tx.nonce &&
      signed.data === tx.data;
    return same ? null : "the amount, recipient or gas differs from what the sender signed";
  } catch {
    return "not a valid signed transaction";
  }
}

export interface Check {
  label: string;
  ok: boolean;
  detail: string;
}

/** The checks a node runs on a block, with a short explanation for each. */
export function verifyBlock(block: BlockType, parent?: BlockType): Check[] {
  const txs = block.transactionsDetailed ?? [];
  const badTx = txs.findIndex((tx) => checkTransaction(tx));
  let root = "";
  try {
    root = merkleRoot(txs.map((tx) => tx.hash));
  } catch {
    // a malformed transaction hash: the root check fails below
  }
  const recomputed = blockHash(block);
  const isGenesis = !parent;

  const checks: Check[] = [
    {
      label: "Signatures",
      ok: badTx < 0,
      detail:
        badTx < 0
          ? txs.length === 0
            ? "no transactions to check"
            : txs.length === 1
              ? "the transaction was signed by its sender, with these exact fields"
              : `all ${txs.length} transactions were signed by their senders, with these exact fields`
          : `transaction ${badTx + 1}: ${checkTransaction(txs[badTx])}`,
    },
    {
      label: "Transactions root",
      ok: root === block.transactionsRoot,
      detail: root === block.transactionsRoot ? "the Merkle root of the transaction hashes matches the header" : "the transactions don't produce the root in the header",
    },
    {
      label: "Block hash",
      ok: recomputed === block.hash,
      detail: recomputed === block.hash ? "recomputed from the header and nonce, it matches" : "the header and nonce hash to something else",
    },
  ];

  if (!isGenesis) {
    const meets = block.hash.startsWith("0x" + "0".repeat(block.difficulty));
    checks.push(
      {
        label: "Proof of work",
        ok: meets,
        detail: meets ? `the hash starts with the required ${block.difficulty} zero${block.difficulty === 1 ? "" : "s"}` : `the hash doesn't start with ${block.difficulty} zeros`,
      },
      {
        label: "Parent link",
        ok: block.previousHash === parent.hash,
        detail: block.previousHash === parent.hash ? `points at block #${parent.number}'s hash` : `doesn't match block #${parent.number}'s hash`,
      }
    );
  }
  return checks;
}

/** Checks for every block; index = height. */
export function verifyChain(blocks: BlockType[]): Check[][] {
  return blocks.map((block, i) => verifyBlock(block, blocks[i - 1]));
}
