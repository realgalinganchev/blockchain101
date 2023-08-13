import { ec as EC } from "elliptic";
import { ethers, Wallet, utils } from "ethers";
import React, { useCallback, useEffect, useState } from "react";
import "./styles/App.css";
import BlockView from "./components/BlockView";
import MempoolView from "./components/MempoolView";
import { BlockType, EthereumTransaction } from "./types/block";
import { getAddress, hexStringToUint8Array } from "./utils/crypto";

const backendApiUrl = process.env.BACKEND_API_URL;
const buttonClickSound = new Audio("/addSound.mp3");
const mineButtonSound = new Audio("/mineSound.mp3");

const App = () => {
  const [blocks, setBlocks] = useState<BlockType[]>([]);
  const [mempool, setMempool] = useState<EthereumTransaction[]>([]);

  const useFetchData = <T extends unknown>(
    url: string,
    setData: React.Dispatch<React.SetStateAction<T>>
  ) => {
    const fetchData = useCallback(() => {
      fetch(url)
        .then((res) => {
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          return res.json();
        })
        .then((data) => {
          setData(data);
        })
        .catch((error) => {
          console.log(
            "There was a problem with your fetch operation: " + error.message
          );
        });
    }, [url, setData]);

    useEffect(() => {
      fetchData();
    }, [fetchData]);

    return fetchData;
  };

  const fetchBlockchain = useFetchData(
    `${backendApiUrl}/blockchain`,
    setBlocks
  );

  const fetchMempool = useFetchData(`${backendApiUrl}/mempool`, setMempool);


  
  const addTransaction = async () => {
    buttonClickSound.play();
    let wallet = Wallet.createRandom();
    let inputPublicKey = wallet.publicKey;

    let outputWallet;
    do {
      outputWallet = Wallet.createRandom();
    } while (inputPublicKey === outputWallet.publicKey);

    const txData = {
      nonce: Math.floor(Math.random() * 1000),
      gasPrice: utils.parseUnits("20", "gwei"),
      gasLimit: 21000,
      to: getAddress(hexStringToUint8Array(outputWallet.publicKey.slice(2))),
      value: ethers.utils.parseEther((Math.random() * 10).toString()),
      data: utils.hexlify([]),
    };

    const transaction = await wallet.signTransaction(txData);

    const transactionToSend: EthereumTransaction = {
      from: wallet.address,
      ...txData,
      id: utils.keccak256(transaction),
    };

    try {
      await fetch(`${backendApiUrl}/transaction`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(transactionToSend),
      });

      setMempool([...mempool, transactionToSend]);
    } catch (error) {
      setMempool(mempool.filter((tx) => tx.to !== transactionToSend.to));
      console.error("Error adding transaction:", error);
    }
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
      .catch((error) => {
        console.error("Error mining block:", error);
      });
  };

  return (
    <div className="App">
      <MempoolView mempool={mempool} />
      <button onClick={addTransaction}>Add Tx to Mempool </button>
      <button className="mine" onClick={mineBlock}>
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
        </div>
      </div>
    </div>
  );
};

export default App;
