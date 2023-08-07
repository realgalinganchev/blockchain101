import { Router, Request, Response } from "express";
import Blockchain from "../classes/Blockchain";
import { addTransaction, mine, mempool } from "../services/blockchain";
import { db } from "../services/firebase";
import { BlockType } from "../react-setup/src/types/block";

const router = Router();
const blockchain = Blockchain.instance;

router.post("/transaction", (req: Request, res: Response) => {
  addTransaction(req.body);
  res.sendStatus(200);
});

router.get("/blockchain", async (_req: Request, res: Response) => {
  try {
    const blocksSnapshot = await db.collection("blockchain").get();
    const blocks: BlockType[] = [];
    blocksSnapshot.forEach((doc) => {
      blocks.push(doc.data() as BlockType);
    });
    res.json(blocks);
  } catch (error: any) {
    res.status(500).json({ error: error.toString() });
  }
});

router.get("/mempool", (req, res) => {
  res.json(mempool);
});

router.get("/mine", (_req: Request, res: Response) => {
  const newBlock = mine();
  res.json(newBlock);
});

export default router;
