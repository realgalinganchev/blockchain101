import React, { useEffect, useState } from "react";
import BlockView from "./BlockView";
import { Transaction, Block } from "./types/block";
import MempoolView from "./MempoolView";
import "./styles/App.css";

const buttonClickSound = new Audio("/addSound.mp3");
const mineButtonSound = new Audio("/mineSound.mp3");

const App = () => {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [mempool, setMempool] = useState<Transaction[]>([]);

  const fetchBlockchain = () => {
    fetch("http://localhost:3000/blockchain")
      .then((res) => res.json())
      .then((blocks: Block[]) => setBlocks(blocks));
  };

  const fetchMempool = () => {
    fetch("http://localhost:3000/mempool")
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

    fetch("http://localhost:3000/transaction", {
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
    fetch("http://localhost:3000/mine", {
      method: "GET",
    })
      .then(fetchBlockchain)
      .then(fetchMempool)
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
        <div>
          {blocks.map((block) => (
            <BlockView key={block.id} block={block} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default App;
