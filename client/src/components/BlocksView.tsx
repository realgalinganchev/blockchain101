import { useEffect, useState } from "react";
import BlockView, { Transaction } from "./BlockView";

interface Block {
  id: number;
  nonce: number;
  hash: string;
  transactions: Transaction[];
}

export default function BlocksView() {
  const [blocks, setBlocks] = useState<Block[]>([]);

  useEffect(() => {
    fetch("/blocks")
      .then((res) => res.json())
      .then((blocks: Block[]) => setBlocks(blocks));
  }, []);

  return (
    <div>
      {blocks.map((block) => (
        <BlockView key={block.id} block={block} />
      ))}
    </div>
  );
}
