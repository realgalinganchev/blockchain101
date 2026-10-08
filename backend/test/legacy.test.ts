import { test } from "node:test";
import assert from "node:assert/strict";
import { Wallet } from "ethers";
import { signTransfer } from "./helpers";
import { validateChain } from "../src/utils/validate";
import { EthereumTransaction, StoredBlock } from "../src/types/block";

// The deploy boots the new backend against whatever production stored before it wipes
// and re-mines the chain, so the node must start (and be resettable) on old-format data.
process.env.STORE = "memory";
const { store } = require("../src/services/db") as typeof import("../src/services/db");
const node = require("../src/services/blockchain") as typeof import("../src/services/blockchain");
const legacy = require("./fixtures/legacy-store.json") as { blocks: StoredBlock[]; mempool: EthereumTransaction[] };

test("the node boots on a chain stored by the previous version, then resets cleanly", async () => {
  for (const block of legacy.blocks) await store.saveBlock(block);
  for (const tx of legacy.mempool) await store.addToMempool(tx);

  await node.initializeBlockchain();
  await node.initializeMempool();

  assert.equal(node.getChain().length, legacy.blocks.length);
  assert.ok(validateChain(node.getChain()).length > 0, "old blocks are reported as problems, not thrown");
  assert.equal(node.getMempool().length, 0, "unsigned old transactions are dropped");
  assert.equal((await store.getMempool()).length, 0);

  node.setDifficulty(1);
  await assert.rejects(node.mineBlock(), /older version/);

  // what CI:Deploy does next: reset, then mine on the fresh chain
  await node.resetBlockchain();
  await node.addTransaction(await signTransfer(Wallet.createRandom()));
  const block = await node.mineBlock();
  assert.equal(block.number, 1);
  assert.deepEqual(validateChain(node.getChain()), []);
});
