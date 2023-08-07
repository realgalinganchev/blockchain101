import { Router, Request, Response } from "express";
import { addTransaction, mineBlock, mempool } from "../services/blockchain";
import { db } from "../services/db/firebaseInit";
import { BlockType } from "../react-setup/src/types/block";

const router = Router();

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
  const newBlock = mineBlock();
  res.json(newBlock);
});

export default router;
