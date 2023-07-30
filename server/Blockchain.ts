import Block from './Block';
import SHA256 from "crypto-js/sha256";

class Blockchain {
    chain: Block[];

    constructor() {
        this.chain = [new Block('Genesis block')];
    }

    addBlock(newBlock: Block) {
        newBlock.previousHash = this.chain[this.chain.length - 1].toHash();
        this.chain.push(newBlock);
    }

    isValid() {
        let isValid = true;

        for (let i = this.chain.length - 1; i >= 1; i--) {
            if (this.chain[i].previousHash.toString() !== SHA256(this.chain[i - 1].data + this.chain[i - 1].previousHash).toString()) {
                isValid = false;
            }
        }

        return isValid;
    }
}

export default Blockchain;
