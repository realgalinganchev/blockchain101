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

const ec = new EC("secp256k1");
const backendApiUrl = process.env.BACKEND_API_URL;
const buttonClickSound = new Audio("/addSound.mp3");
const mineButtonSound = new Audio("/mineSound.mp3");

const App = () => {
  const [blocks, setBlocks] = useState<BlockType[]>([]);
  const [isLoadingBlockchain, setIsLoadingBlockchain] = useState(false);
  const [mempool, setMempool] = useState<EthereumTransaction[]>([]);
  const [isLoadingMempool, setIsLoadingMempool] = useState(false);

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

  const getNonceForAddress = async (address: string): Promise<number> => {
    // TO DO: add logic to fetch the nonce for the given address from the Ethereum network or your backend
    return Math.floor(Math.random() * 1000);
  };

  const addTransaction = async () => {
    buttonClickSound.play();
    setIsLoadingMempool(true);
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
      .then(() => {
        setMempool([...mempool, transactionToSend]);
        setIsLoadingMempool(false);
      })
      .catch((error) => {
        setMempool(mempool.filter((tx) => tx.to !== transactionToSend.to));
        setIsLoadingMempool(false);
        console.error("Error adding transaction:", error);
      });
  };

  const mineBlock = () => {
    setIsLoadingBlockchain(true);
    mineButtonSound.play();
    fetch(`${backendApiUrl}/mine`, {
      method: "GET",
    })
      .then(() => {
        fetchBlockchain();
        fetchMempool();
        setIsLoadingBlockchain(false);
      })
      .catch((error) => {
        setIsLoadingBlockchain(false);
        console.error("Error mining block:", error);
      });
  };

  return (
    <div className="App">
      <MempoolView mempool={mempool} />
      {isLoadingMempool ? (
        <div className="loader mempool" />
      ) : (
        <button onClick={addTransaction}>Add Tx to Mempool</button>
      )}

      <button className="mine" onClick={mineBlock}>
        Mine Block
      </button>
      <div className="Blockchain">
        <h1>Blockchain</h1>
        <div className="BlocksContainer">
          {blocks
            .sort((a, b) => a.timestamp - b.timestamp)
            .map((block: BlockType, index: number) => (
              <BlockView
                key={index}
                block={block}
                index={index}
                isCompactView={blocks.length > 9}
              />
            ))}
          {isLoadingBlockchain && <div className="loader" />}
        </div>
      </div>
    </div>
  );
};

export default App;
