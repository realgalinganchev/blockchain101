import { ethers } from "ethers";
import BlockClass from "../classes/Block";
import { BlockType, EthereumTransaction } from "../react-setup/src/types/block";
import { getTotalGasUsed } from "./calc";

export function createGenesisBlock(): BlockClass {
  let genesisBlock = new BlockClass("Genesis block", "0");
  genesisBlock.timestamp = Date.now();
  genesisBlock.nonce = ethers.utils.hexlify(0);
  genesisBlock.hash = genesisBlock.toHash();
  return genesisBlock;
}

export function constructBlock(blockData: any): BlockClass {
  let block = new BlockClass(blockData.data, blockData.previousHash);
  block.timestamp = blockData.timestamp;
  block.transactions = blockData.transactions;
  block.transactionsDetailed = blockData.transactionsDetailed;
  block.difficulty = blockData.difficulty;
  block.gasLimit = ethers.BigNumber.from(blockData.gasLimit);
  block.gasUsed = ethers.BigNumber.from(blockData.gasUsed);
  block.miner = blockData.miner;
  block.extraData = blockData.extraData;
  return block;
}

export function createNewBlock(
  transactions: EthereumTransaction[],
  previousHash: string,
  blockNumber: number
): BlockType {
  const block = new BlockClass("", previousHash);
  block.transactions = transactions.map((t) => t.hash || "");
  block.transactionsDetailed = transactions;
  block.number = blockNumber;
  block.difficulty = 100;
  block.gasLimit = ethers.BigNumber.from(5000000);
  block.gasUsed = getTotalGasUsed(transactions);
  block.miner = "0x1234567890abcdef";
  block.extraData = "";

  return block;
}