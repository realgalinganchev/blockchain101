import React, { useState } from "react";
import "./styles/App.css";
import BlockView from "./components/BlockView";
import { createTransaction } from "./utils/calc";
import MempoolView from "./components/MempoolView";
import { useFetchData } from "./hooks/useFetchData";
import { BlockType, EthereumTransaction } from "./types/block";

const BUTTON_CLICK_SOUND = new Audio("/addSound.mp3");
const MINE_BUTTON_SOUND = new Audio("/mineSound.mp3");
const API_URL = process.env.BACKEND_API_URL || "/api";

const App = () => {
  const [isLoadingTx, setIsLoadingTx] = useState(false);
  const [isLoadingBlock, setIsLoadingBlock] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [difficulty, setDifficultyState] = useState(4);
  const [lastMiningTime, setLastMiningTime] = useState<number | null>(null);
  const [miningAbortController, setMiningAbortController] = useState<AbortController | null>(null);
  const [currentMiningHash, setCurrentMiningHash] = useState<string>("");
  const [currentNonce, setCurrentNonce] = useState<number>(0);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successData, setSuccessData] = useState<{ nonce: string; hash: string; difficulty: number } | null>(null);

  const [blocks, setBlocks] = useState<BlockType[]>([]);
  const [mempool, setMempool] = useState<EthereumTransaction[]>([]);
  const [eventSource, setEventSource] = useState<EventSource | null>(null);

  const fetchBlockchain = useFetchData(`${API_URL}/blockchain`, setBlocks);
  const fetchMempool = useFetchData(`${API_URL}/mempool`, setMempool);

  // Set up persistent SSE connection on mount
  React.useEffect(() => {
    const es = new EventSource(`${API_URL}/mining-progress`);

    es.onopen = () => {
      console.log("Persistent SSE opened!");
    };

    es.onmessage = (event) => {
      try {
        const { hash, nonce } = JSON.parse(event.data);
        setCurrentMiningHash(hash);
        setCurrentNonce(nonce);
      } catch (err) {
        console.error("Parse error:", err);
      }
    };

    es.onerror = (error) => {
      console.error("Persistent SSE error:", error);
    };

    setEventSource(es);

    return () => {
      es.close();
    };
  }, []);

  const mineBlock = async () => {
    setIsLoadingBlock(true);
    MINE_BUTTON_SOUND.play();

    const abortController = new AbortController();
    setMiningAbortController(abortController);

    try {
      const response = await fetch(`${API_URL}/mine`, {
        signal: abortController.signal,
      });
      const data = await response.json();
      if (data.miningTime) {
        setLastMiningTime(data.miningTime);
      }

      // Show success popup
      setSuccessData({
        nonce: data.nonce,
        hash: data.hash,
        difficulty: difficulty
      });
      setShowSuccessPopup(true);

      // Hide popup after 3 seconds
      setTimeout(() => {
        setShowSuccessPopup(false);
      }, 5000);

      fetchBlockchain();
      fetchMempool();
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log("Mining stopped by user");
      } else {
        console.error("Error mining block:", error);
      }
    } finally {
      setIsLoadingBlock(false);
      setMiningAbortController(null);
      setCurrentMiningHash("");
      setCurrentNonce(0);
    }
  };

  const stopMining = async () => {
    if (miningAbortController) {
      miningAbortController.abort();
      setMiningAbortController(null);
      setIsLoadingBlock(false);
    }

    // Tell backend to abort mining
    try {
      await fetch(`${API_URL}/abort-mining`, {
        method: "POST",
      });
      setCurrentMiningHash("");
      setCurrentNonce(0);
    } catch (error) {
      console.error("Error aborting mining:", error);
    }
  };

  const addTransaction = async () => {
    BUTTON_CLICK_SOUND.play();
    setIsLoadingTx(true);

    try {
      const transactionToSend: EthereumTransaction = await createTransaction();
      const response = await fetch(`${API_URL}/transaction`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(transactionToSend),
      });


      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setMempool((prevMempool) => [...prevMempool, transactionToSend]);
    } catch (error) {
      alert(`Error adding transaction: ${error}`);
    } finally {
      setIsLoadingTx(false);
    }
  };

  const deleteBlockchain = async () => {
    if (!confirm("Are you sure you want to delete the entire blockchain?")) {
      return;
    }

    setIsDeleting(true);
    try {
      await fetch(`${API_URL}/blockchain`, {
        method: "DELETE",
      });
      setBlocks([]);
      setMempool([]);
    } catch (error) {
      console.error("Error deleting blockchain:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDifficultyChange = (newDifficulty: number) => {
    setDifficultyState(newDifficulty);

    fetch(`${API_URL}/difficulty`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ difficulty: newDifficulty }),
    }).catch((error) => {
      console.error("Error setting difficulty:", error);
    });
  };

  return (
    <div className="app">
      {showSuccessPopup && successData && (
        <div className="success-popup">
          <div className="success-popup-content">
            <h2 className="game-font">Block Mined!</h2>
            <p><strong>Difficulty:</strong> {successData.difficulty} leading zeros</p>
            <p><strong>Final Nonce:</strong> {parseInt(successData.nonce, 16)}</p>
            <p><strong>Hash:</strong> {(() => {
              const cleanHash = successData.hash.replace('0x', '');
              return `${cleanHash.slice(0, 10)}...${cleanHash.slice(-3)}`;
            })()}</p>
          </div>
        </div>
      )}
      <div className="difficulty-controls">
        <label htmlFor="difficulty-slider">
          Mining Difficulty: {difficulty} leading zeros
        </label>
        <input
          id="difficulty-slider"
          type="range"
          min="1"
          max="7"
          value={difficulty}
          onChange={(e) => handleDifficultyChange(Number(e.target.value))}
        />
        {lastMiningTime !== null && (
          <div className="mining-stats">
            Last block mined in: {(lastMiningTime / 1000).toFixed(2)}s
          </div>
        )}
      </div>
      <MempoolView mempool={mempool} isLoading={isLoadingTx} />
      <button onClick={addTransaction} disabled={isLoadingTx}>
        Add Tx to Mempool
      </button>
      {isLoadingBlock ? (
        <button className="stop-mining" onClick={stopMining}>
          Stop Mining
        </button>
      ) : (
        <button className="mine" onClick={mineBlock}>
          Mine Block
        </button>
      )}
      <button className="delete" onClick={deleteBlockchain} disabled={isDeleting}>
        Delete Blockchain
      </button>
      <div className="blockchain">
        <h1 className="game-font">Blockchain</h1>
        <div className="blocks-container">
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
          {isLoadingBlock && (
            <div className="mining-block">
              <div className="mining-progress">
                <p>Nonce: {currentNonce || "Starting..."}</p>
                <p>Hash: {currentMiningHash ? currentMiningHash.substring(0, 20) + "..." : "Waiting..."}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
