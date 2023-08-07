import { BigNumber, ethers } from "ethers";
import BlockClass from "../classes/Block";
import Blockchain from "../classes/Blockchain";
import {
  BlockType,
  EthereumTransaction,
} from "../react-setup/src/components/types/block";
import { MAX_TRANSACTIONS, TARGET_DIFFICULTY } from "../constants/tx";

const blockchain = Blockchain.instance;

export function createGenesisBlock() {
  const genesisBlock = new BlockClass("Genesis block", "0");
  genesisBlock.timestamp = Date.now();
  genesisBlock.nonce = ethers.utils.hexlify(0);
  blockchain.addBlock(genesisBlock);
  genesisBlock.hash = genesisBlock.toHash();
  return genesisBlock;
}

function getGasLimit(gasLimit: BigNumber) {
  return gasLimit !== undefined
    ? ethers.BigNumber.from(gasLimit)
    : ethers.BigNumber.from(0);
}

function getGasUsed(gasUsed: BigNumber) {
  return gasUsed !== undefined
    ? ethers.BigNumber.from(gasUsed)
    : ethers.BigNumber.from(0);
}

export function createBlock(blockData: BlockType) {
  let block = new BlockClass(blockData.data, blockData.previousHash);
  assignBlockData(block, blockData);
  return block;
}

export function assignBlockData(block: BlockType, blockData: BlockType) {
  block.timestamp = blockData.timestamp;
  block.transactions = blockData.transactions;
  block.transactionsDetailed = blockData.transactionsDetailed;
  block.difficulty = blockData.difficulty;
  block.gasLimit = getGasLimit(blockData.gasLimit);
  block.gasUsed = getGasUsed(blockData.gasUsed);
  block.miner = blockData.miner;
  block.extraData = blockData.extraData;
}

export function createNewBlock(mempool: EthereumTransaction[]) {
  const previousHash = blockchain.getLatestBlock().hash;
  const block = new BlockClass("", previousHash);
  assignNewBlockData(block, mempool);
  return block;
}

function encodeTransaction(transaction: EthereumTransaction) {
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

function calculateProofOfWork(block: BlockType) {
  let n = 0;
  do {
    block.nonce = ethers.utils.hexlify(n);
    block.hash = block.toHash();
    n++;
  } while (BigInt(`${block.hash}`) > TARGET_DIFFICULTY);

  block.timestamp = Date.now();
}

function getGasUsedForTransactions(
  selectedTransactions: EthereumTransaction[]
) {
  return ethers.BigNumber.from(
    selectedTransactions
      .map((tx) => ethers.BigNumber.from(tx.gasLimit))
      .reduce((sum, gasLimit) => sum.add(gasLimit), ethers.BigNumber.from(0))
  );
}

function toHexString(value: ethers.BigNumberish | undefined): string {
  if (value === undefined) {
    throw new Error("Value is undefined");
  }

  return typeof value === "string"
    ? value
    : ethers.BigNumber.from(value).toHexString();
}

export function prepareTransactionsForBlock(
  mempool: EthereumTransaction[]
): EthereumTransaction[] {
  let selectedTransactions: EthereumTransaction[] = mempool.splice(
    0,
    Math.min(mempool.length, MAX_TRANSACTIONS)
  );
  return selectedTransactions.map(encodeTransaction);
}

export function assignNewBlockData(
  block: BlockType,
  mempool: EthereumTransaction[]
) {
  let selectedTransactions: EthereumTransaction[] =
    prepareTransactionsForBlock(mempool);
  block.transactions = selectedTransactions.map((t) => t.hash || "");
  block.transactionsDetailed = selectedTransactions;
  calculateProofOfWork(block);
  block.number = blockchain.getLatestBlock().number + 1;
  block.difficulty = 100;
  block.gasLimit = ethers.BigNumber.from(5000000);
  block.gasUsed = getGasUsedForTransactions(selectedTransactions);
  block.miner = "0x1234567890abcdef";
  block.extraData = "";
  blockchain.addBlock(block);
}
