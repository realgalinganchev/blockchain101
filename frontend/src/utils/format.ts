import { BigNumber, utils } from "ethers";
import { EthereumTransaction } from "../types/block";

/**
 * Amounts arrive as ethers BigNumbers (transactions added in this tab) or in their
 * JSON form, `{ type: "BigNumber", hex }`, once they have been through the API.
 */
export const toBigNumber = (value: unknown): BigNumber | null => {
  if (value === undefined || value === null) return null;
  if (BigNumber.isBigNumber(value)) return value;
  if (typeof value === "object") {
    const hex = (value as { hex?: string; _hex?: string }).hex ?? (value as { _hex?: string })._hex;
    return hex ? BigNumber.from(hex) : null;
  }
  try {
    return BigNumber.from(value as string | number);
  } catch {
    return null;
  }
};

const trimDecimals = (amount: string, maxDecimals: number): string => {
  const [whole, fraction = ""] = amount.split(".");
  let kept = fraction.slice(0, maxDecimals).replace(/0+$/, "");
  // Tiny amounts (the pre-mined demo transactions move a few hundred gwei): keep
  // three significant digits instead of rounding them away to 0.
  if (whole === "0" && !kept && /[1-9]/.test(fraction)) {
    kept = fraction.slice(0, fraction.search(/[1-9]/) + 3).replace(/0+$/, "");
  }
  return kept ? `${whole}.${kept}` : whole;
};

export const formatEth = (value: unknown, maxDecimals = 4): string => {
  const amount = toBigNumber(value);
  return amount ? `${trimDecimals(utils.formatEther(amount), maxDecimals)} ETH` : "—";
};

export const formatGwei = (value: unknown): string => {
  const amount = toBigNumber(value);
  return amount ? `${trimDecimals(utils.formatUnits(amount, "gwei"), 2)} gwei` : "—";
};

/** The most the sender can pay for gas: gas price × gas limit. */
export const maxFee = (tx: EthereumTransaction): BigNumber | null => {
  const gasPrice = toBigNumber(tx.gasPrice);
  const gasLimit = toBigNumber(tx.gasLimit);
  return gasPrice && gasLimit ? gasPrice.mul(gasLimit) : null;
};

export const sumValues = (txs: EthereumTransaction[]): BigNumber =>
  txs.reduce((sum, tx) => sum.add(toBigNumber(tx.value) ?? 0), BigNumber.from(0));

/** EIP-55 mixed-case address, whatever case the input uses. */
export const checksum = (address?: string): string | undefined => {
  if (!address) return address;
  try {
    return utils.getAddress(address);
  } catch {
    return address;
  }
};

export const leadingZeros = (hash?: string): number =>
  ((hash ?? "").replace(/^0x/, "").match(/^0*/) ?? [""])[0].length;
