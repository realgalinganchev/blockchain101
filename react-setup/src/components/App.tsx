import React, { useEffect, useState } from "react";
import "./styles/App.css";
import BlockView from "./BlockView";
import MempoolView from "./MempoolView";
import { BlockType, TransactionType } from "./types/block";

const backendApiUrl = process.env.BACKEND_API_URL;
const buttonClickSound = new Audio("/addSound.mp3");
const mineButtonSound = new Audio("/mineSound.mp3");
//import { deleteAllBlocks } from "../../../services/blockchain";

const App = () => {
  const [blocks, setBlocks] = useState<BlockType[]>([]);
  const [mempool, setMempool] = useState<TransactionType[]>([]);

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

  const addTransaction = () => {
    buttonClickSound.play();
    const id = Math.random().toString(36).substring(2);
    const timestamp = Date.now();
    const inputAddress = "0x" + Math.random().toString(36).substring(2);
    const inputAmount = Math.random();
    const inputSignature = Math.random().toString(36).substring(2);
    const outputAddress = "0x" + Math.random().toString(36).substring(2);
    const outputAmount = Math.random();

    const transaction = {
      id,
      timestamp,
      input: {
        address: inputAddress,
        amount: inputAmount,
        signature: inputSignature,
      },
      output: {
        address: outputAddress,
        amount: outputAmount,
      },
    };

    fetch(`${backendApiUrl}/transaction`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(transaction),
    })
      .then(() => setMempool([...mempool, transaction]))
      .catch((error) => {
        setMempool(mempool.filter((tx) => tx.id !== transaction.id));
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
