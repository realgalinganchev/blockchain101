import React, { useEffect, useState } from "react";
import BlockView from "./BlockView";
import { Transaction } from "./types/block";

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

  useEffect(() => {
    fetch("http://localhost:3000/blocks")
      .then((res) => res.json())
      .then((blocks: Block[]) => setBlocks(blocks));
  }, []);

  return (
    <div>
      <h1>Hello, React!</h1>
      {blocks.map((block) => (
        <BlockView key={block.id} block={block} />
      ))}
    </div>
  );
};

export default App;
