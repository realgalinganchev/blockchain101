import CryptoJS from 'crypto-js';
import { TransactionType } from '../components/types/block';

export function getAddress(publicKey: Uint8Array): string {
  const publicKeyHexString = Array.from(publicKey).map(b => b.toString(16).padStart(2, '0')).join('');
  const hashMsg = CryptoJS.SHA3(publicKeyHexString, { outputLength: 256 });
  const last20ofHash = hashMsg.toString(CryptoJS.enc.Hex).slice(-40);
  
  return `0x${last20ofHash}`;
}

export function createMsgHash(transaction: TransactionType): string {
  const {
    id,
    timestamp,
    input: { publicKey: inputPublicKey, amount: inputAmount },
    output: { publicKey: outputPublicKey, amount: outputAmount },
  } = transaction;

  const inputPublicKeyHex = Array.from(inputPublicKey).map(b => b.toString(16).padStart(2, '0')).join('');
  const outputPublicKeyHex = Array.from(outputPublicKey).map(b => b.toString(16).padStart(2, '0')).join('');

  return CryptoJS.SHA256(
    id + timestamp + inputPublicKeyHex + inputAmount + outputPublicKeyHex + outputAmount
  ).toString();
}
