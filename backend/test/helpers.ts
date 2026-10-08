import { Wallet, utils } from "ethers";
import { CHAIN_ID } from "../src/constants/tx";

export const recipient = Wallet.createRandom().address;

/** A signed legacy transfer, the same shape the frontend sends. */
export function signTransfer(wallet: Wallet, overrides: Partial<utils.UnsignedTransaction> = {}): Promise<string> {
  return wallet.signTransaction({
    chainId: CHAIN_ID,
    nonce: 0,
    gasPrice: utils.parseUnits("20", "gwei"),
    gasLimit: 21000,
    to: recipient,
    value: utils.parseEther("1.5"),
    data: "0x",
    ...overrides,
  });
}
