import React, { useEffect, useState } from "react";
import BlockView from "./BlockView";
import { Transaction } from "./types/block";
import MempoolView from "./MempoolView";

interface Block {
  id: number;
  nonce: number;
  hash: string;
  transactions: Transaction[];
  data: string;
  previousHash: string;
  toHash: () => string;
}

const App = () => {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [mempool, setMempool] = useState([]);

  useEffect(() => {
    fetch("http://localhost:3000/blockchain")
      .then((res) => res.json())
      .then((blocks: Block[]) => setBlocks(blocks));
  }, []);

  useEffect(() => {
    fetch("http://localhost:3000/mempool")
      .then((res) => res.json())
      .then((mempoolData) => setMempool(mempoolData));
  }, []);

  return (
    <div>
      <h1>Blocks</h1>
      {blocks.map((block) => (
        <BlockView key={block.id} block={block} />
      ))}
      <MempoolView mempool={mempool} />
    </div>
  );
};

export default App;
