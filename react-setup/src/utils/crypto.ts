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

export function hexStringToUint8Array(hexString: string) {
  if (hexString.length % 2 !== 0) {
    throw new Error("Invalid hexString");
  }
  var arrayBuffer = new Uint8Array(hexString.length / 2);

  for (var i = 0; i < hexString.length; i += 2) {
    var byteValue = parseInt(hexString.substring(i, i+2), 16);
    if (isNaN(byteValue)) {
      throw new Error("Invalid hexString");
    }
    arrayBuffer[i / 2] = byteValue;
  }

  return arrayBuffer;
}

export function formatHash(hash: string): string {
  const formattedHash: string = `${hash.slice(0, 2)}..${hash.slice(-3)}`;
  return formattedHash;
}
