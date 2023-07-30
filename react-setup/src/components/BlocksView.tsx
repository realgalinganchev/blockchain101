// BlocksView component
import { useEffect, useState } from "react";
import BlockView from "./BlockView";
import React from "react";
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

export default function BlocksView() {
  const [blocks, setBlocks] = useState<Block[]>([]);

  useEffect(() => {
    fetch("http://localhost:3000/blocks")
      .then((res) => res.json())
      .then((blocks: Block[]) => setBlocks(blocks));
  }, []);

  return (
    <>
      {blocks.map((block) => (
        <BlockView key={block.id} block={block} />
      ))}
    </>
  );
}
