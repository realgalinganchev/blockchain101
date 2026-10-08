import { Wallet, utils } from "ethers";

/** Must match the node's chain id (backend/src/constants/tx.ts): it is part of every signature (EIP-155). */
export const CHAIN_ID = 1337;

/**
 * Done by hand on purpose, to show how an Ethereum address comes from a public key:
 * keccak256 of the 64-byte public key (without its 0x04 prefix), keep the last 20 bytes,
 * then apply the EIP-55 mixed-case checksum.
 */
export function getAddress(uncompressedPublicKey: string): string {
  const hash = utils.keccak256(utils.hexDataSlice(uncompressedPublicKey, 1));
  return utils.getAddress(utils.hexDataSlice(hash, 12));
}

/**
 * Creates a fresh wallet in the browser and signs a transfer to another fresh wallet.
 * Only the signed bytes are sent: the node recovers the sender from the signature.
 */
export const createTransaction = async (): Promise<string> => {
  const sender = Wallet.createRandom();
  const recipient = Wallet.createRandom();

  return sender.signTransaction({
    chainId: CHAIN_ID,
    nonce: 0, // the sender's first transaction
    gasPrice: utils.parseUnits("20", "gwei"),
    gasLimit: 21000,
    to: getAddress(recipient.publicKey),
    value: utils.parseEther((0.01 + Math.random() * 9.99).toFixed(4)),
    data: "0x",
  });
};
