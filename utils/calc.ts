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

export async function calculateProofOfWork(
  block: BlockType,
  difficulty: number = 4,
  onProgress?: (hash: string, nonce: number) => void,
  shouldAbort?: () => boolean
): Promise<BlockType> {
  let n = 0;
  const target = "0x" + "0".repeat(difficulty);

  return new Promise((resolve, reject) => {
    const mine = () => {
      // Check if mining should be aborted
      if (shouldAbort && shouldAbort()) {
        console.log("Mining aborted by user");
        reject(new Error("Mining aborted"));
        return;
      }

      const startTime = Date.now();

      // Mine for up to 10ms at a time, then yield control
      while (Date.now() - startTime < 10) {
        block.nonce = ethers.utils.hexlify(n);
        block.hash = block.toHash();

        // Report progress on every iteration
        if (onProgress) {
          onProgress(block.hash, n);
        }

        if (block.hash.startsWith(target)) {
          // Don't update timestamp after finding valid hash - it would change the hash!
          resolve(block);
          return;
        }

        n++;
      }

      // Yield control to allow SSE messages to be flushed
      setImmediate(mine);
    };

    mine();
  });
}
