import { utils } from "ethers";
import BlockClass from "../classes/Block";

/** How often mining progress is reported; every attempt would flood the SSE stream. */
const PROGRESS_INTERVAL_MS = 100;

/**
 * Proof of work: tries nonces 0, 1, 2, … until keccak256(sealHash ‖ nonce) starts with
 * `block.difficulty` zeros. The seal hash is computed once; each attempt only rewrites
 * the 32 nonce bytes. Mines in 10 ms slices and yields in between, so the server keeps
 * answering requests and streaming progress.
 */
export async function calculateProofOfWork(
  block: BlockClass,
  onProgress?: (hash: string, nonce: number) => void,
  shouldAbort?: () => boolean
): Promise<BlockClass> {
  const target = "0x" + "0".repeat(block.difficulty);
  const input = new Uint8Array(64);
  input.set(utils.arrayify(block.sealHash()), 0);
  const nonceView = new DataView(input.buffer, 32, 32);
  let lastReport = 0;
  let n = 0;

  return new Promise((resolve, reject) => {
    const mine = () => {
      if (shouldAbort?.()) {
        reject(new Error("Mining aborted"));
        return;
      }

      const sliceEnd = Date.now() + 10;
      let hash = "";
      while (Date.now() < sliceEnd) {
        for (let i = 0; i < 256; i++, n++) {
          // nonce as a 32-byte big-endian number (fits in the last 8 bytes)
          nonceView.setUint32(24, Math.floor(n / 2 ** 32));
          nonceView.setUint32(28, n >>> 0);
          hash = utils.keccak256(input);

          if (hash.startsWith(target)) {
            block.nonce = utils.hexlify(n);
            block.hash = hash;
            onProgress?.(hash, n);
            resolve(block);
            return;
          }
        }
        if (onProgress && Date.now() - lastReport >= PROGRESS_INTERVAL_MS) {
          lastReport = Date.now();
          onProgress(hash, n - 1);
        }
      }

      setImmediate(mine);
    };

    mine();
  });
}
