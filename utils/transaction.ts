import { ethers } from "ethers";
import {  EthereumTransaction } from "../react-setup/src/types/block";
import { toHexString } from "./calc";

export function getSelectedTransactions(
  mempool: EthereumTransaction[],
  MAX_TRANSACTIONS: number
): EthereumTransaction[] {
  return mempool.splice(0, Math.min(mempool.length, MAX_TRANSACTIONS));
}

export function prepareTransactionsForBlock(
  transactions: EthereumTransaction[]
): EthereumTransaction[] {
  return transactions.map(encodeTransaction);
}

export function encodeTransaction(
  transaction: EthereumTransaction
): EthereumTransaction {
  const transactionFields = [
    toHexString(transaction.nonce),
    toHexString(transaction.gasPrice),
    toHexString(transaction.gasLimit),
    transaction.to,
    toHexString(transaction.value),
    transaction.data,
  ];

  const rlpEncoded = ethers.utils.RLP.encode(transactionFields);
  const rawTransactionHash = ethers.utils.keccak256(rlpEncoded);

  return {
    ...transaction,
    hash: rawTransactionHash,
  };
}

