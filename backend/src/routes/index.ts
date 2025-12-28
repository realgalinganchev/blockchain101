import { Router, Request, Response } from "express";
import { addTransaction, mineBlock, mempool, getDifficulty, setDifficulty, addMiningProgressListener, removeMiningProgressListener, getMiningState, abortMining } from "../services/blockchain";
import { db } from "../services/db/firebaseInit";
import { BlockType } from "../types/block";

const router = Router();

router.post("/transaction", async (req: Request, res: Response) => {
  try {
    await addTransaction(req.body);
    res.sendStatus(200);
  } catch (error: any) {
    console.error("Error adding transaction:", error);
    res.status(500).json({ error: error.toString() });
  }
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

router.get("/mine", async (_req: Request, res: Response) => {
  try {
    const newBlock = await mineBlock();
    res.json(newBlock);
  } catch (error: any) {
    if (error.message === "Mining aborted") {
      res.status(499).json({ error: "Mining aborted by user" });
    } else {
      console.error("Error mining block:", error);
      res.status(500).json({ error: error.toString() });
    }
  }
});

router.delete("/blockchain", async (_req: Request, res: Response) => {
  try {
    const blocksSnapshot = await db.collection("blockchain").get();
    const batch = db.batch();
    blocksSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();
    res.sendStatus(200);
  } catch (error: any) {
    res.status(500).json({ error: error.toString() });
  }
});

router.get("/difficulty", (_req: Request, res: Response) => {
  res.json({ difficulty: getDifficulty() });
});

router.post("/difficulty", (req: Request, res: Response) => {
  const { difficulty } = req.body;
  if (typeof difficulty === "number" && difficulty >= 1 && difficulty <= 7) {
    setDifficulty(difficulty);
    res.json({ difficulty });
  } else {
    res.status(400).json({ error: "Difficulty must be between 1 and 7" });
  }
});

router.get("/mining-progress", (req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("X-Accel-Buffering", "no"); // Disable buffering in nginx

  // Disable compression for this route
  res.socket?.setNoDelay(true);
  res.socket?.setTimeout(0);

  // Send initial comment to establish connection
  res.write(": connected\n\n");

  const listener = (hash: string, nonce: number) => {
    res.write(`data: ${JSON.stringify({ hash, nonce })}\n\n`);
  };

  addMiningProgressListener(listener);

  req.on("close", () => {
    removeMiningProgressListener(listener);
  });
});

router.get("/mining-state", (_req: Request, res: Response) => {
  res.json(getMiningState());
});

router.post("/abort-mining", (_req: Request, res: Response) => {
  abortMining();
  res.json({ message: "Mining aborted" });
});

export default router;
