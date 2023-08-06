import React, { useEffect, useState } from "react";
import "./styles/App.css";
import BlockView from "./BlockView";
import MempoolView from "./MempoolView";
import { BlockType, EthereumTransaction } from "./types/block";
import { ec as EC } from "elliptic";
import { ethers, Wallet, utils } from "ethers";

const ec = new EC("secp256k1");
const backendApiUrl = process.env.BACKEND_API_URL;
const buttonClickSound = new Audio("/addSound.mp3");
const mineButtonSound = new Audio("/mineSound.mp3");

const App = () => {
  const [blocks, setBlocks] = useState<BlockType[]>([]);
  const [mempool, setMempool] = useState<EthereumTransaction[]>([]);

  const fetchBlockchain = () => {
    fetch(`${backendApiUrl}/blockchain`)
      .then((res) => res.json())
      .then((blocks: BlockType[]) => setBlocks(blocks));
  };

  const fetchMempool = () => {
    fetch(`${backendApiUrl}/mempool`)
      .then((res) => res.json())
      .then((mempoolData) => setMempool(mempoolData));
  };

  useEffect(fetchBlockchain, []);
  useEffect(fetchMempool, []);

  const getNonceForAddress = async (address: string): Promise<number> => {
    // TO DO: add logic to fetch the nonce for the given address from the Ethereum network or your backend
    return Math.floor(Math.random() * 1000);
  };

  const addTransaction = async () => {
    buttonClickSound.play();

    let wallet = Wallet.createRandom();
    let inputPrivateKey = wallet.privateKey;
    let inputPublicKey = wallet.publicKey;

    let outputWallet;
    do {
      outputWallet = Wallet.createRandom();
    } while (inputPublicKey === outputWallet.publicKey);

    const txData = {
      nonce: await getNonceForAddress(wallet.address),
      gasPrice: utils.parseUnits("20", "gwei"),
      gasLimit: 21000,
      to: outputWallet.address,
      value: ethers.utils.parseEther((Math.random() * 10).toString()),
      data: utils.hexlify([]), 
    };

    const transaction = await wallet.signTransaction(txData);

    const transactionToSend: EthereumTransaction = {
      from: wallet.address,
      ...txData,
      id: utils.keccak256(transaction),
    };

    fetch(`${backendApiUrl}/transaction`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(transactionToSend),
    })
      .then(() => setMempool([...mempool, transactionToSend]))
      .catch((error) => {
        setMempool(mempool.filter((tx) => tx.to !== transactionToSend.to));
        console.error("Error adding transaction:", error);
      });
  };

  const mineBlock = () => {
    mineButtonSound.play();
    fetch(`${backendApiUrl}/mine`, {
      method: "GET",
    })
      .then(() => {
        fetchBlockchain();
        fetchMempool();
      })
      .catch((error) => console.error("Error mining block:", error));
  };

  return (
    <div className="App">
      <MempoolView mempool={mempool} />
      <button onClick={addTransaction}>Add Tx to Mempool</button>
      <button className="mine" onClick={mineBlock}>
        Mine Block
      </button>
      <div className="Blockchain">
        <h1>Blockchain</h1>
        <div className="BlocksContainer">
          {blocks
            .sort((a, b) => a.timestamp - b.timestamp)
            .map((block: BlockType) => (
              <BlockView
                key={block.id}
                block={block}
                isCompactView={blocks.length > 9}
              />
            ))}
        </div>
      </div>
    </div>
  );
};

export default App;
