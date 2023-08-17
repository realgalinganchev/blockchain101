import { BlockType } from "../react-setup/src/types/block";

class Blockchain {
  chain: BlockType[];
  static instance = new Blockchain();

  constructor(initialChain: BlockType[] = []) {
    this.chain = initialChain;
  }

  addBlock(newBlock: BlockType) {
    if (this.chain.length > 0) {
      newBlock.previousHash = this.getLatestBlock().hash;
    }
    newBlock.hash = newBlock.toHash();
    this.chain.push(newBlock);
  }

  getLatestBlock(): BlockType {
    return this.chain[this.chain.length - 1];
  }
}

export default Blockchain;
