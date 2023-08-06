import CryptoJS from "crypto-js";

// using this and not ethers on purpose in order to show how the ethereum addresses are
// derived from the publicKey

export function getAddress(publicKey: Uint8Array): string {
  const publicKeyHexString = Array.from(publicKey)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  const hashMsg = CryptoJS.SHA3(publicKeyHexString, { outputLength: 256 });
  const last20ofHash = hashMsg.toString(CryptoJS.enc.Hex).slice(-40);

  return `0x${last20ofHash}`;
}

export function formatHash(hash: string): string {
  const formattedHash: string = `${hash.slice(0, 2)}..${hash.slice(-3)}`;
  return formattedHash;
}
