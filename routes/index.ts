import { Router, Request, Response } from "express";
import Blockchain from "../classes/Blockchain";
import { addTransaction, mine, mempool } from "../services/blockchain";

const router = Router();
const blockchain = Blockchain.instance;

router.post("/transaction", (req: Request, res: Response) => {
  addTransaction(req.body);
  res.sendStatus(200);
});

router.get("/blockchain", (_req: Request, res: Response) => {
  res.json(blockchain.chain);
});

router.get("/mempool", (req, res) => {
  res.json(mempool);
});

router.get("/mine", (_req: Request, res: Response) => {
  const newBlock = mine();
  res.json(newBlock);
});

export default router;
