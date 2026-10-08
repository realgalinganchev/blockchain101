import BlockClass from "../classes/Block";
import { EthereumTransaction, StoredBlock } from "../types/block";
import { merkleRoot } from "./hash";
import { totalGas } from "./transaction";

export function createGenesisBlock(): BlockClass {
  return new BlockClass({
    number: 0,
    timestamp: Date.now(),
    previousHash: "0",
    transactionsRoot: merkleRoot([]),
    difficulty: 0,
    data: "Genesis block",
    gasUsed: "0",
    transactions: [],
    transactionsDetailed: [],
  });
}

/** Rebuilds a block read from the database, keeping its stored nonce and hash. */
export function constructBlock(stored: StoredBlock): BlockClass {
  return new BlockClass(stored);
}

/** An unmined block on top of `parent`; calculateProofOfWork then finds its nonce. */
export function createNewBlock(transactions: EthereumTransaction[], parent: StoredBlock, difficulty: number): BlockClass {
  const hashes = transactions.map((tx) => tx.hash);
  return new BlockClass({
    number: parent.number + 1,
    timestamp: Date.now(),
    previousHash: parent.hash,
    transactionsRoot: merkleRoot(hashes),
    difficulty,
    data: "",
    gasUsed: totalGas(transactions),
    transactions: hashes,
    transactionsDetailed: transactions,
  });
}
