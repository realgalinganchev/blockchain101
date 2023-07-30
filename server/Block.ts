import SHA256 from 'crypto-js/sha256';

class Block {
    data: string;
    previousHash: string;

    constructor(data: string, previousHash = '') {
        this.data = data;
        this.previousHash = previousHash;
    }

    toHash(): string {
        return SHA256(this.data + this.previousHash).toString();
    }
}

export default Block;

