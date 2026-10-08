import { Router, Request, Response } from "express";
import {
  addTransaction,
  mineBlock,
  getChain,
  getMempool,
  getDifficulty,
  setDifficulty,
  getMiningState,
  abortMining,
  resetBlockchain,
} from "../services/blockchain";
import { subscribe } from "../services/events";
import { TransactionError } from "../utils/transaction";
import { limits, requireAdmin, MAX_DIFFICULTY, MAX_MEMPOOL } from "../middleware/security";

const router = Router();

// Body: { raw: "0x…" }, a signed legacy transaction. Answers with the decoded transaction.
router.post("/transaction", limits.transaction, async (req: Request, res: Response) => {
  if (MAX_MEMPOOL && getMempool().length >= MAX_MEMPOOL) {
    res.status(429).json({ error: "The mempool is full. Mine a block to make room." });
    return;
  }
  try {
    const tx = await addTransaction(req.body?.raw);
    res.status(201).json(tx);
  } catch (error: any) {
    if (error instanceof TransactionError) {
      res.status(error.status).json({ error: error.message });
      return;
    }
    console.error("Error adding transaction:", error);
    res.status(500).json({ error: "Could not add the transaction." });
  }
});

// The chain from genesis to tip, served from memory (it is loaded from the store on start).
router.get("/blockchain", (_req: Request, res: Response) => {
  res.json(getChain());
});

router.get("/mempool", (_req: Request, res: Response) => {
  res.json(getMempool());
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
      res.status(500).json({ error: "Mining failed." });
    }
  }
});

router.delete("/blockchain", limits.control, requireAdmin, async (_req: Request, res: Response) => {
  try {
    await resetBlockchain();
    res.sendStatus(200);
  } catch (error: any) {
    console.error("Error resetting the chain:", error);
    res.status(500).json({ error: "Could not reset the chain." });
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

// Server-Sent Events for every viewer: mining progress as plain messages, plus named
// events when mining starts or stops, a block is mined, the mempool changes or the
// chain is reset, so all open tabs stay in sync.
router.get("/mining-progress", (req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/event-stream");
  // no-transform: compressing proxies (webpack-dev-server, gzip/zstd encoders) would
  // otherwise buffer the stream and hold events back
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no"); // Disable buffering in nginx

  res.socket?.setNoDelay(true);
  res.socket?.setTimeout(0);

  // Send initial comment to establish connection
  res.write(": connected\n\n");
  if (getMiningState().isMining) res.write(`event: mining\ndata: ${JSON.stringify({ active: true })}\n\n`);

  const unsubscribe = subscribe((event) => {
    if (event.type === "progress") {
      res.write(`data: ${JSON.stringify({ hash: event.hash, nonce: event.nonce })}\n\n`);
    } else {
      res.write(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`);
    }
  });

  // Keep idle streams open through the Caddy/nginx proxies (they drop silent connections).
  const keepAlive = setInterval(() => res.write(": ping\n\n"), 25_000);

  req.on("close", () => {
    clearInterval(keepAlive);
    unsubscribe();
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
