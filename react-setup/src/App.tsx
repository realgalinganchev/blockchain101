import React, { useState } from "react";
import "./styles/App.css";
import BlockView from "./components/BlockView";
import { createTransaction } from "./utils/calc";
import MempoolView from "./components/MempoolView";
import { useFetchData } from "./hooks/useFetchData";
import { BlockType, EthereumTransaction } from "./types/block";

const BUTTON_CLICK_SOUND = new Audio("/addSound.mp3");
const MINE_BUTTON_SOUND = new Audio("/mineSound.mp3");
const API_URL = process.env.BACKEND_API_URL;

const App = () => {
  const [isLoadingTx, setIsLoadingTx] = useState(false);
  const [isLoadingBlock, setIsLoadingBlock] = useState(false);

  const [blocks, setBlocks] = useState<BlockType[]>([]);
  const [mempool, setMempool] = useState<EthereumTransaction[]>([]);

  const fetchBlockchain = useFetchData(`${API_URL}/blockchain`, setBlocks);
  const fetchMempool = useFetchData(`${API_URL}/mempool`, setMempool);

  const mineBlock = async () => {
    setIsLoadingBlock(true);
    MINE_BUTTON_SOUND.play();
    try {
      await fetch(`${API_URL}/mine`);
      fetchBlockchain();
      fetchMempool();
    } catch (error) {
      console.error("Error mining block:", error);
    } finally {
      setIsLoadingBlock(false);
    }
  };

  const addTransaction = async () => {
    BUTTON_CLICK_SOUND.play();
    setIsLoadingTx(true);

    try {
      const transactionToSend: EthereumTransaction = await createTransaction();
      await fetch(`${API_URL}/transaction`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(transactionToSend),
      });

      setMempool((prevMempool) => [...prevMempool, transactionToSend]);
    } catch (error) {
      console.error("Error adding transaction:", error);
    } finally {
      setIsLoadingTx(false);
    }
  };

  return (
    <div className="App">
      <MempoolView mempool={mempool} isLoading={isLoadingTx} />
      <button onClick={addTransaction} disabled={isLoadingTx}>
        Add Tx to Mempool
      </button>
      <button className="mine" onClick={mineBlock} disabled={isLoadingBlock}>
        Mine Block
      </button>
      <div className="Blockchain">
        <h1 className="gameFont">Blockchain</h1>
        <div className="BlocksContainer">
          {blocks
            .sort((a, b) => a.timestamp - b.timestamp)
            .map((block: BlockType, index: number) => (
              <BlockView
                key={index}
                block={block}
                index={index}
                isCompactView={blocks.length > 6}
              />
            ))}
          {isLoadingBlock && <div className="loader"></div>}
        </div>
      </div>
    </div>
  );
};

export default App;
