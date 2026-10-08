import { test, before } from "node:test";
import assert from "node:assert/strict";
import { Wallet, utils } from "ethers";
import { signTransfer } from "./helpers";
import { validateChain } from "../src/utils/validate";
import { merkleRoot, meetsDifficulty } from "../src/utils/hash";

process.env.STORE = "memory";
// Required after STORE is set: the service picks its store on import.
const node = require("../src/services/blockchain") as typeof import("../src/services/blockchain");

before(async () => {
  await node.initializeBlockchain();
  await node.initializeMempool();
});

test("a mined block includes the pending transaction and the chain validates", async () => {
  const raw = await signTransfer(Wallet.createRandom());
  const tx = await node.addTransaction(raw);
  node.setDifficulty(2);

  const block = await node.mineBlock();
  const chain = node.getChain();

  assert.equal(block.number, 1);
  assert.deepEqual(block.transactions, [tx.hash]);
  assert.equal(block.transactionsRoot, merkleRoot([tx.hash]));
  assert.ok(meetsDifficulty(block.hash, 2));
  assert.equal(node.getMempool().length, 0);
  assert.deepEqual(validateChain(chain), []);

  // the same signed transaction can't be replayed
  await assert.rejects(node.addTransaction(raw), /already in a block/);
});

test("each sender's nonce must follow their earlier transactions", async () => {
  const wallet = Wallet.createRandom();
  await assert.rejects(node.addTransaction(await signTransfer(wallet, { nonce: 5 })), /next nonce is 0/);
  await node.addTransaction(await signTransfer(wallet, { nonce: 0 }));
  await node.addTransaction(await signTransfer(wallet, { nonce: 1 }));
  await assert.rejects(node.addTransaction(await signTransfer(wallet, { nonce: 1, value: 7 })), /next nonce is 2/);
  await node.mineBlock();
  await node.addTransaction(await signTransfer(wallet, { nonce: 2 }));
});

test("aborting mining keeps the transactions pending", async () => {
  const pendingBefore = node.getMempool().length;
  assert.ok(pendingBefore > 0);
  node.setDifficulty(7); // ~268M attempts: won't finish before the abort
  const mining = node.mineBlock();
  setTimeout(() => node.abortMining(), 50);

  await assert.rejects(mining, /Mining aborted/);
  assert.equal(node.getMempool().length, pendingBefore);
  assert.equal(node.getMiningState().isMining, false);
});

test("tampering with a mined block is detected, and breaks the next block's link", async () => {
  node.setDifficulty(1);
  await node.mineBlock();
  const chain = node.getChain();
  const target = chain.findIndex((b) => b.transactionsDetailed.length > 0);
  assert.ok(target > 0 && target < chain.length - 1);

  // 1. edit an amount: no longer what the sender signed
  const edited = JSON.parse(JSON.stringify(chain)) as typeof chain;
  edited[target].transactionsDetailed[0].value = utils.parseEther("1000").toString();
  assert.match(validateChain(edited).join("\n"), new RegExp(`block #${target}: transaction 1: value`));

  // 2. swap in a different signed transaction: the transactions root no longer matches
  const swapped = JSON.parse(JSON.stringify(chain)) as typeof chain;
  const other = await node.addTransaction(await signTransfer(Wallet.createRandom()));
  swapped[target].transactionsDetailed[0] = other;
  swapped[target].transactions[0] = other.hash;
  assert.match(validateChain(swapped).join("\n"), /transactions root/);

  // 3. recompute the root too: now the block hash (and its proof of work) is wrong
  swapped[target].transactionsRoot = merkleRoot(swapped[target].transactions);
  assert.match(validateChain(swapped).join("\n"), /hash doesn't match the header/);

  // 4. replace the hash as well: the next block's parent link breaks
  swapped[target].hash = utils.keccak256(utils.toUtf8Bytes("forged"));
  assert.match(validateChain(swapped).join("\n"), new RegExp(`block #${target + 1}: the previous hash doesn't match`));
});

test("reset leaves only a fresh genesis block", async () => {
  await node.resetBlockchain();
  const chain = node.getChain();
  assert.equal(chain.length, 1);
  assert.equal(chain[0].previousHash, "0");
  assert.equal(node.getMempool().length, 0);
  assert.deepEqual(validateChain(chain), []);
});
