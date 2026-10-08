import Block from "./Block";
import { validateBlock } from "../utils/validate";

class Blockchain {
  chain: Block[] = [];
  static instance = new Blockchain();

  getLatestBlock(): Block {
    return this.chain[this.chain.length - 1];
  }

  /** Throws unless `block` is valid on top of the current tip. */
  assertCanAppend(block: Block) {
    const problems = validateBlock(block, this.getLatestBlock());
    if (problems.length) throw new Error(`Invalid block #${block.number}: ${problems.join("; ")}`);
  }

  addBlock(block: Block) {
    this.assertCanAppend(block);
    this.chain.push(block);
  }
}

export default Blockchain;
