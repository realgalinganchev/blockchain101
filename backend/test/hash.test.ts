import { test } from "node:test";
import assert from "node:assert/strict";
import { constants, utils } from "ethers";
import { meetsDifficulty, merkleRoot, powHash, sealHash } from "../src/utils/hash";
import { calculateProofOfWork } from "../src/utils/calc";
import { createGenesisBlock, createNewBlock } from "../src/utils/block";

const h = (s: string) => utils.keccak256(utils.toUtf8Bytes(s));
const pair = (a: string, b: string) => utils.keccak256(utils.concat([a, b]));

test("merkle root of no transactions is the zero hash", () => {
  assert.equal(merkleRoot([]), constants.HashZero);
});

test("merkle root of one transaction is its hash", () => {
  assert.equal(merkleRoot([h("a")]), h("a"));
});

test("merkle root hashes pairs level by level, pairing an odd one out with itself", () => {
  const [a, b, c] = [h("a"), h("b"), h("c")];
  assert.equal(merkleRoot([a, b]), pair(a, b));
  assert.equal(merkleRoot([a, b, c]), pair(pair(a, b), pair(c, c)));
});

test("merkle root changes when transactions are reordered", () => {
  assert.notEqual(merkleRoot([h("a"), h("b")]), merkleRoot([h("b"), h("a")]));
});

test("mining finds a nonce whose hash meets the difficulty and matches the header", async () => {
  const block = createNewBlock([], createGenesisBlock(), 2);
  await calculateProofOfWork(block);
  assert.ok(meetsDifficulty(block.hash, 2));
  assert.equal(powHash(sealHash(block), block.nonce), block.hash);
  assert.equal(block.toHash(), block.hash);
});
