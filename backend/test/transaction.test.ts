import { test } from "node:test";
import assert from "node:assert/strict";
import { Wallet, utils } from "ethers";
import { CHAIN_ID } from "../src/constants/tx";
import { TransactionError, checkTransaction, decodeSignedTransaction } from "../src/utils/transaction";
import { recipient, signTransfer } from "./helpers";

const rejects = (raw: unknown, message: RegExp) =>
  assert.throws(() => decodeSignedTransaction(raw), (error: unknown) => error instanceof TransactionError && message.test(error.message));

test("decodes a signed transfer and recovers the sender from the signature", async () => {
  const wallet = Wallet.createRandom();
  const raw = await signTransfer(wallet);
  const tx = decodeSignedTransaction(raw);

  assert.equal(tx.from, wallet.address);
  assert.equal(tx.to, recipient);
  assert.equal(tx.hash, utils.keccak256(raw));
  assert.equal(tx.value, utils.parseEther("1.5").toString());
  assert.equal(tx.chainId, CHAIN_ID);
  assert.equal(checkTransaction(tx), null);
});

test("rejects input that isn't a signed transaction", async () => {
  rejects(undefined, /hex string/);
  rejects("not hex", /hex string/);
  rejects("0x1234", /RLP/);
  const unsigned = utils.serializeTransaction({ chainId: CHAIN_ID, nonce: 0, gasPrice: 1, gasLimit: 21000, to: recipient, value: 1 });
  rejects(unsigned, /not signed/);
});

test("rejects a signature for another chain (EIP-155)", async () => {
  rejects(await signTransfer(Wallet.createRandom(), { chainId: 1 }), /chain 1/);
});

test("rejects contract creation and gas below a plain transfer", async () => {
  rejects(await signTransfer(Wallet.createRandom(), { to: undefined }), /recipient/);
  rejects(await signTransfer(Wallet.createRandom(), { gasLimit: 20000 }), /below 21000/);
});

test("rejects typed (EIP-1559) transactions", async () => {
  const raw = await Wallet.createRandom().signTransaction({
    type: 2,
    chainId: CHAIN_ID,
    nonce: 0,
    maxFeePerGas: 1,
    maxPriorityFeePerGas: 1,
    gasLimit: 21000,
    to: recipient,
    value: 1,
  });
  rejects(raw, /legacy/);
});

test("a stored field that differs from the signed bytes is caught", async () => {
  const tx = decodeSignedTransaction(await signTransfer(Wallet.createRandom()));
  assert.match(checkTransaction({ ...tx, value: utils.parseEther("1000").toString() }) ?? "", /value/);
  assert.match(checkTransaction({ ...tx, from: Wallet.createRandom().address }) ?? "", /from/);
});
