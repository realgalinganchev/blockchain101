import React, {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useState,
} from "react";
import "./styles/App.css";
import BlockView from "./BlockView";
import MempoolView from "./MempoolView";
import { BlockType, EthereumTransaction } from "./types/block";
import { ec as EC } from "elliptic";
import { ethers, Wallet, utils } from "ethers";
import { getAddress, hexStringToUint8Array } from "../utils/crypto";

const ec = new EC("secp256k1");
const backendApiUrl = process.env.BACKEND_API_URL;
const buttonClickSound = new Audio("/addSound.mp3");
const mineButtonSound = new Audio("/mineSound.mp3");

const App = () => {
  const [blocks, setBlocks] = useState<BlockType[]>([]);
  const [mempool, setMempool] = useState<EthereumTransaction[]>([]);
  const [isDisplayed, setIsDisplayed] = useState<boolean>(true);

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

  const getNonceForAddress = async (address: string): Promise<number> => {
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
      from: getAddress(hexStringToUint8Array(wallet.privateKey)),
      ...txData,
      id: utils.keccak256(transaction),
    };

    setMempool((prevMempool) => [...prevMempool, transactionToSend]);

    try {
      await fetch(`${backendApiUrl}/transaction`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(transactionToSend),
      });
    } catch (error) {
      setMempool((prevMempool) =>
        prevMempool.filter((tx) => tx.id !== transactionToSend.id)
      );
      console.error("Error adding transaction:", error);
    }
  };

  const mineBlock = async () => {
    mineButtonSound.play();
    const currentMempool = [...mempool];
    setMempool((prevMempool) => prevMempool.slice(0, -10));

    await fetch(`${backendApiUrl}/mine`, {
      method: "GET",
    })
      .then(() => fetchBlockchain())
      .catch((error) => {
        console.error("Error mining block:", error);
      });
  };

  const deleteBlockchain = async () => {
    setBlocks([]);
    setIsDisplayed(false);
    try {
      await fetch(`${backendApiUrl}/delete`, {
        method: "GET",
      });
    } catch (error) {
      fetchBlockchain();
      console.error("Error deleting blockchain:", error);
    }
  };

  const initializeBlockchain = async () => {
    setIsDisplayed(true);
    setBlocks([
      {
        data: "Genesis block",
        nonce: "0x0000000000000042",
        hash: "0xd4e56740f876aef8c010b86a40d5f56745a118d0906a34e69aec8c0db1cb8fa3",
        timestamp: Date.now(),
      } as any,
    ]);

    try {
      const response = await fetch(`${backendApiUrl}/init`, {
        method: "GET",
      });
    } catch (error) {
      console.error("Error initializing blockchain:", error);
    }
  };

  return (
    <div className="App">
      <MempoolView mempool={mempool} />
      {isDisplayed && (
        <>
          <button onClick={addTransaction}>Add Tx to Mempool</button>
          <button className="mine" onClick={mineBlock}>
            Mine Block
          </button>
          <button className="delete" onClick={deleteBlockchain}>
            Delete Blockchain
          </button>
        </>
      )}
      <button className="init" onClick={initializeBlockchain}>
        Initiliaze Blockchain
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
