import React, { useEffect, useState } from "react";
import "./styles/App.css";
import BlockView from "./BlockView";
import MempoolView from "./MempoolView";
import { BlockType, TransactionType } from "./types/block";
import { createMsgHash, getAddress } from "../utils/crypto";
import { ec as EC } from "elliptic"; 

const ec = new EC("secp256k1");
const backendApiUrl = process.env.BACKEND_API_URL;
const buttonClickSound = new Audio("/addSound.mp3");
const mineButtonSound = new Audio("/mineSound.mp3");

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
    let inputKey = ec.genKeyPair();
    let inputPublicKey = inputKey.getPublic().encode("hex", false);

    let outputKey;
    let outputPublicKey;
    do {
      outputKey = ec.genKeyPair();
      outputPublicKey = outputKey.getPublic().encode("hex", false);
    } while (inputPublicKey === outputPublicKey); 

    const inputAmount = Math.random();
    const outputAmount = Math.random();

    let inputAddress = getAddress(new TextEncoder().encode(inputPublicKey));
    let outputAddress = getAddress(new TextEncoder().encode(outputPublicKey));

    const transaction = {
      id,
      timestamp,
      input: {
        publicKey: new TextEncoder().encode(inputPublicKey),
        amount: inputAmount,
        signature: "",
      },
      output: {
        publicKey: new TextEncoder().encode(outputPublicKey),
        amount: outputAmount,
      },
    };

    const msgHash = createMsgHash(transaction);
    const inputSignature = inputKey.sign(msgHash).toDER("hex");
    transaction.input.signature = inputSignature;

    const transactionToSend = {
      ...transaction,
      input: {
        ...transaction.input,
        address: inputAddress,
      },
      output: {
        ...transaction.output,
        address: outputAddress,
      },
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
        setMempool(mempool.filter((tx) => tx.id !== transactionToSend.id));
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
