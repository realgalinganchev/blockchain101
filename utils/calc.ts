import { ethers } from "ethers";
import BlockClass from "../classes/Block";
import { TARGET_DIFFICULTY } from "../constants/tx";
import { BlockType, EthereumTransaction } from "../react-setup/src/types/block";

export function getTotalGasUsed(
  transactions: EthereumTransaction[]
): ethers.BigNumber {
  return ethers.BigNumber.from(
    transactions
      .map((tx) => ethers.BigNumber.from(tx.gasLimit))
      .reduce((sum, gasLimit) => sum.add(gasLimit), ethers.BigNumber.from(0))
  );
}

export function toHexString(value: ethers.BigNumberish | undefined): string {
  if (value === undefined) {
    throw new Error("Value is undefined");
  }

  return typeof value === "string"
    ? value
    : ethers.BigNumber.from(value).toHexString();
}

export function calculateProofOfWork(block: BlockType): BlockType {
  let n = 0;
  do {
    block.nonce = ethers.utils.hexlify(n);
    block.hash = block.toHash();
    n++;
  } while (BigInt(`${block.hash}`) > TARGET_DIFFICULTY);

  block.timestamp = Date.now();

  return block;
}
