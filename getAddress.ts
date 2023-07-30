import { keccak256 } from "ethereum-cryptography/keccak";

function getAddress(publicKey: Uint8Array): Uint8Array {
    const firstByteOff = publicKey.slice(1);
    const hashMsg = keccak256(firstByteOff);
    const last20ofHash = hashMsg.slice(-20);
    return last20ofHash;
}

export default getAddress;
