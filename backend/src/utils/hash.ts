import { constants, utils } from "ethers";
import { BlockHeader } from "../types/block";

/**
 * Merkle root of the transaction hashes: hash neighbours together in pairs, level by
 * level, until one hash is left (an odd one out is paired with itself, as in Bitcoin).
 * Changing, adding, removing or reordering any transaction changes the root.
 */
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

/**
 * Hash of every header field except the nonce. Like Ethash's seal hash, it is computed
 * once per block; each mining attempt then only hashes it together with a new nonce.
 */
export function sealHash(header: BlockHeader): string {
  return utils.keccak256(
    utils.defaultAbiCoder.encode(
      ["uint256", "uint256", "string", "bytes32", "uint8", "string"],
      [header.number, header.timestamp, header.previousHash, header.transactionsRoot, header.difficulty, header.data]
    )
  );
}

/** The block hash: keccak256(sealHash ‖ nonce as 32 bytes). */
export function powHash(seal: string, nonce: utils.BytesLike | number): string {
  return utils.keccak256(utils.concat([seal, utils.hexZeroPad(utils.hexlify(nonce), 32)]));
}

export function meetsDifficulty(hash: string, difficulty: number): boolean {
  return hash.startsWith("0x" + "0".repeat(difficulty));
}
