// BlocksView component
import { useEffect, useState } from "react";
import BlockView, { Transaction } from "./BlockView";
import React from "react";

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
    fetch("/blocks")
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
