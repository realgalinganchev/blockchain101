import { Router, Request, Response } from "express";
import { addTransaction, mineBlock, mempool, getMempoolSize, getDifficulty, setDifficulty, addMiningProgressListener, removeMiningProgressListener, getMiningState, abortMining, resetBlockchain } from "../services/blockchain";
import { db } from "../services/db/firebaseInit";
import { BlockType } from "../types/block";
import { limits, requireAdmin, MAX_DIFFICULTY, MAX_MEMPOOL } from "../middleware/security";

const router = Router();

router.post("/transaction", limits.transaction, async (req: Request, res: Response) => {
  if (MAX_MEMPOOL && getMempoolSize() >= MAX_MEMPOOL) {
    res.status(429).json({ error: "The mempool is full. Mine a block to make room." });
    return;
  }
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

router.get("/mine", limits.mine, async (_req: Request, res: Response) => {
  // One shared chain: two miners racing for the same block number would corrupt it.
  if (getMiningState().isMining) {
    res.status(409).json({ error: "A block is already being mined. Watch the progress, then try again." });
    return;
  }
  try {
    const newBlock = await mineBlock();
    res.json(newBlock);
  } catch (error: any) {
    if (error.message === "Mining aborted") {
      res.status(499).json({ error: "Mining aborted by user" });
    } else if (error.message === "Mining timed out") {
      res.status(503).json({ error: "Mining took too long and was stopped. Try a lower difficulty." });
    } else {
      console.error("Error mining block:", error);
      res.status(500).json({ error: error.toString() });
    }
  }
});

router.delete("/blockchain", limits.control, requireAdmin, async (_req: Request, res: Response) => {
  try {
    // Delete blockchain from Firebase
    const blocksSnapshot = await db.collection("blockchain").get();
    const blocksBatch = db.batch();
    blocksSnapshot.docs.forEach((doc) => {
      blocksBatch.delete(doc.ref);
    });
    await blocksBatch.commit();

    // Delete mempool from Firebase
    const mempoolSnapshot = await db.collection("mempool").get();
    const mempoolBatch = db.batch();
    mempoolSnapshot.docs.forEach((doc) => {
      mempoolBatch.delete(doc.ref);
    });
    await mempoolBatch.commit();

    // Reset in-memory state and create fresh genesis block
    await resetBlockchain();

    res.sendStatus(200);
  } catch (error: any) {
    res.status(500).json({ error: error.toString() });
  }
});

router.get("/difficulty", (_req: Request, res: Response) => {
  res.json({ difficulty: getDifficulty(), maxDifficulty: MAX_DIFFICULTY });
});

router.post("/difficulty", limits.control, (req: Request, res: Response) => {
  const { difficulty } = req.body;
  if (Number.isInteger(difficulty) && difficulty >= 1 && difficulty <= MAX_DIFFICULTY) {
    setDifficulty(difficulty);
    res.json({ difficulty });
  } else {
    res.status(400).json({ error: `Difficulty must be between 1 and ${MAX_DIFFICULTY}` });
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

  // Keep idle streams open through the Caddy/nginx proxies (they drop silent connections).
  const keepAlive = setInterval(() => res.write(": ping\n\n"), 25_000);

  req.on("close", () => {
    clearInterval(keepAlive);
    removeMiningProgressListener(listener);
  });
});

router.get("/mining-state", (_req: Request, res: Response) => {
  res.json(getMiningState());
});

router.post("/abort-mining", limits.control, (_req: Request, res: Response) => {
  abortMining();
  res.json({ message: "Mining aborted" });
});

export default router;
