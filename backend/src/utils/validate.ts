import { StoredBlock } from "../types/block";
import { meetsDifficulty, merkleRoot, powHash, sealHash } from "./hash";
import { checkTransaction } from "./transaction";

/**
 * Everything a node checks before it accepts a block on top of `parent` (or as the
 * genesis block when there is no parent). Returns the problems found; empty means valid.
 */
export function validateBlock(block: StoredBlock, parent?: StoredBlock): string[] {
  const problems: string[] = [];
  const txHashes = block.transactionsDetailed.map((tx) => tx.hash);

  block.transactionsDetailed.forEach((tx, i) => {
    const problem = checkTransaction(tx);
    if (problem) problems.push(`transaction ${i + 1}: ${problem}`);
  });
  if (block.transactions.join() !== txHashes.join()) {
    problems.push("the transaction hash list doesn't match the transactions");
  }
  if (merkleRoot(txHashes) !== block.transactionsRoot) {
    problems.push("the transactions root doesn't match the transactions");
  }
  if (powHash(sealHash(block), block.nonce) !== block.hash) {
    problems.push("the hash doesn't match the header and nonce");
  }

  if (!parent) {
    if (block.number !== 0 || block.previousHash !== "0") problems.push("a genesis block must be number 0 with previous hash 0");
    return problems;
  }
  if (block.previousHash !== parent.hash) problems.push(`the previous hash doesn't match block #${parent.number}`);
  if (block.number !== parent.number + 1) problems.push(`the block number should be ${parent.number + 1}`);
  if (block.timestamp < parent.timestamp) problems.push("the timestamp is earlier than the parent's");
  if (!meetsDifficulty(block.hash, block.difficulty)) {
    problems.push(`the hash doesn't start with ${block.difficulty} zeros (proof of work)`);
  }
  return problems;
}

/** Validates a whole chain from genesis; returns every problem, labelled with its block. */
export function validateChain(chain: StoredBlock[]): string[] {
  return chain.flatMap((block, i) => validateBlock(block, chain[i - 1]).map((problem) => `block #${block.number}: ${problem}`));
}
