import React, { useState } from "react";
import "./styles/App.css";
import BlockView, { timeAgo } from "./components/BlockView";
import HashText from "./components/HashText";
import { createTransaction } from "./utils/calc";
import MempoolView from "./components/MempoolView";
import BlockModal from "./components/BlockModal";
import Modal from "./components/Modal";
import TxDetails from "./components/TxDetails";
import { useFetchData } from "./hooks/useFetchData";
import { BlockType, EthereumTransaction } from "./types/block";
import { verifyChain } from "./utils/verify";

const BUTTON_CLICK_SOUND = new Audio("/addSound.mp3");
const MINE_BUTTON_SOUND = new Audio("/mineSound.mp3");
const API_URL = process.env.BACKEND_API_URL || "/api";

// play() rejects when the browser blocks audio; the sound is optional
const play = (sound: HTMLAudioElement) => {
  sound.play().catch(() => undefined);
};

const App = () => {
  const [isLoadingTx, setIsLoadingTx] = useState(false);
  const [isLoadingBlock, setIsLoadingBlock] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [difficulty, setDifficultyState] = useState(4);
  const [maxDifficulty, setMaxDifficulty] = useState(7);
  const [lastMiningTime, setLastMiningTime] = useState<number | null>(null);
  const [miningAbortController, setMiningAbortController] = useState<AbortController | null>(null);
  const [currentMiningHash, setCurrentMiningHash] = useState<string>("");
  const [currentNonce, setCurrentNonce] = useState<number>(0);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successData, setSuccessData] = useState<{ nonce: string; hash: string; difficulty: number } | null>(null);

  const [blocks, setBlocks] = useState<BlockType[]>([]);
  const [mempool, setMempool] = useState<EthereumTransaction[]>([]);
  // A block is being mined by anyone (this tab or another visitor), as announced over SSE
  const [remoteMining, setRemoteMining] = useState(false);

  // Detail modals: a block by its height, or a pending transaction from the mempool
  const [openBlock, setOpenBlock] = useState<number | null>(null);
  const [openTx, setOpenTx] = useState<EthereumTransaction | null>(null);
  const [newBlockHash, setNewBlockHash] = useState<string | null>(null);

  const fetchBlockchain = useFetchData(`${API_URL}/blockchain`, setBlocks);
  const fetchMempool = useFetchData(`${API_URL}/mempool`, setMempool);

  // The server owns difficulty (and caps it on the public demo), so start from its values.
  const fetchDifficulty = React.useCallback(() => {
    fetch(`${API_URL}/difficulty`)
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((data: { difficulty: number; maxDifficulty?: number }) => {
        setDifficultyState(data.difficulty);
        if (data.maxDifficulty) setMaxDifficulty(data.maxDifficulty);
      })
      .catch((error) => console.error("Error fetching difficulty:", error));
  }, []);

  React.useEffect(() => {
    fetchDifficulty();
  }, [fetchDifficulty]);

  // One SSE stream for everything live: mining progress arrives as plain messages, and
  // named events keep this tab in sync with what every other visitor does.
  React.useEffect(() => {
    const es = new EventSource(`${API_URL}/mining-progress`);
    const refresh = () => {
      fetchBlockchain();
      fetchMempool();
    };
    const on = <T,>(type: string, handler: (data: T) => void) =>
      es.addEventListener(type, (event) => {
        try {
          handler(JSON.parse((event as MessageEvent).data));
        } catch (err) {
          console.error(`Bad ${type} event:`, err);
        }
      });

    es.onmessage = (event) => {
      try {
        const { hash, nonce } = JSON.parse(event.data);
        setCurrentMiningHash(hash);
        setCurrentNonce(nonce);
        setRemoteMining(true);
      } catch (err) {
        console.error("Parse error:", err);
      }
    };
    on<{ active: boolean }>("mining", ({ active }) => {
      setRemoteMining(active);
      if (!active) {
        setCurrentMiningHash("");
        setCurrentNonce(0);
      }
    });
    on("block", refresh);
    on("mempool", fetchMempool);
    on("reset", refresh);
    on<{ difficulty: number }>("difficulty", ({ difficulty }) => setDifficultyState(difficulty));

    // EventSource reconnects by itself; catch up on anything missed while disconnected
    let connectedBefore = false;
    es.onopen = () => {
      if (connectedBefore) refresh();
      connectedBefore = true;
    };

    return () => es.close();
  }, [fetchBlockchain, fetchMempool]);

  // Keep the newest block in view as the chain grows
  const chainRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const el = chainRef.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [blocks.length, isLoadingBlock]);

  const mineBlock = async () => {
    setIsLoadingBlock(true);
    play(MINE_BUTTON_SOUND);

    const abortController = new AbortController();
    setMiningAbortController(abortController);

    try {
      const response = await fetch(`${API_URL}/mine`, {
        signal: abortController.signal,
      });
      const data = await response.json();
      if (!response.ok) {
        // Already mining (409), timed out (503), rate limited (429) or aborted (499)
        if (response.status !== 499) alert(data.error ?? `Mining failed (HTTP ${response.status})`);
        return;
      }
      if (data.miningTime) {
        setLastMiningTime(data.miningTime);
      }

      // Show success popup
      setSuccessData({
        nonce: data.nonce,
        hash: data.hash,
        difficulty: data.difficulty ?? difficulty,
      });
      setShowSuccessPopup(true);
      setNewBlockHash(data.hash);
      setTimeout(() => setNewBlockHash((hash) => (hash === data.hash ? null : hash)), 6000);

      // Hide popup after 5 seconds
      setTimeout(() => {
        setShowSuccessPopup(false);
      }, 5000);

      fetchBlockchain();
      fetchMempool();
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log("Mining stopped by user");
      } else {
        console.error("Error mining block:", error);
      }
    } finally {
      setIsLoadingBlock(false);
      setMiningAbortController(null);
      setCurrentMiningHash("");
      setCurrentNonce(0);
    }
  };

  const stopMining = async () => {
    if (miningAbortController) {
      miningAbortController.abort();
      setMiningAbortController(null);
      setIsLoadingBlock(false);
    }

    // Tell backend to abort mining
    try {
      await fetch(`${API_URL}/abort-mining`, {
        method: "POST",
      });
      setCurrentMiningHash("");
      setCurrentNonce(0);
    } catch (error) {
      console.error("Error aborting mining:", error);
    }
  };

  const addTransaction = async () => {
    play(BUTTON_CLICK_SOUND);
    setIsLoadingTx(true);

    try {
      // Signed here, in the browser; the node recovers the sender from the signature
      const raw = await createTransaction();
      const response = await fetch(`${API_URL}/transaction`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ raw }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error ?? `HTTP ${response.status}`);
      }

      const tx = data as EthereumTransaction;
      setMempool((prev) => (prev.some((t) => t.hash === tx.hash) ? prev : [...prev, tx]));
    } catch (error: any) {
      alert(`Could not add the transaction: ${error.message ?? error}`);
    } finally {
      setIsLoadingTx(false);
    }
  };

  const deleteBlockchain = async () => {
    if (!confirm("Are you sure you want to delete the entire blockchain?")) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`${API_URL}/blockchain`, {
        method: "DELETE",
      });
      if (!response.ok) {
        // 403 on the public demo, where resets are admin-only
        const data = await response.json().catch(() => ({}));
        alert(data.error ?? `Reset failed (HTTP ${response.status})`);
        return;
      }
      fetchBlockchain();
      fetchMempool();
    } catch (error) {
      console.error("Error deleting blockchain:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDifficultyChange = (newDifficulty: number) => {
    setDifficultyState(newDifficulty);

    fetch(`${API_URL}/difficulty`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ difficulty: newDifficulty }),
    })
      .then(async (response) => {
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          alert(data.error ?? `Could not set difficulty (HTTP ${response.status})`);
          fetchDifficulty(); // snap the slider back to the server's value
        }
      })
      .catch((error) => {
        console.error("Error setting difficulty:", error);
      });
  };

  const sortedBlocks = React.useMemo(() => [...blocks].sort((a, b) => a.number - b.number || a.timestamp - b.timestamp), [blocks]);
  // Every block re-checked in the browser: signatures, transactions root, hash, proof of work, links
  const blockValid = React.useMemo(() => verifyChain(sortedBlocks).map((checks) => checks.every((c) => c.ok)), [sortedBlocks]);
  const firstInvalid = blockValid.indexOf(false);
  const someoneMining = isLoadingBlock || remoteMining;
  const height = Math.max(sortedBlocks.length - 1, 0);
  const latest = sortedBlocks[sortedBlocks.length - 1];
  const target = "0".repeat(difficulty);
  const liveHex = currentMiningHash.replace(/^0x/, "");
  const matched = (liveHex.match(/^0*/) ?? [""])[0].length;
  const openBlockByHash = (hash: string) => {
    const index = sortedBlocks.findIndex((b) => b.hash === hash);
    if (index >= 0) setOpenBlock(index);
  };

  return (
    <div className="page">
      <header className="topbar">
        <div className="brand">
          <span className="brand__mark" aria-hidden>
            <svg viewBox="0 0 24 24"><path d="M12 2 3 7v10l9 5 9-5V7z" /><path d="M3 7l9 5 9-5M12 12v10" /></svg>
          </span>
          <span className="brand__name">blockchain101</span>
          <span className="brand__tag">PoW · pre-Merge Ethereum</span>
        </div>
        <a className="link" href="https://github.com/realgalinganchev/blockchain101" target="_blank" rel="noreferrer">
          Source on GitHub ↗
        </a>
      </header>

      <section className="hero">
        <h1>Mine a block, <span className="accent">live</span>.</h1>
        <p>
          Sign transactions with throwaway wallets in your browser, then mine them into a block. The node searches for a
          nonce until the block's Keccak-256 hash starts with the target number of zeros: proof of work, as Ethereum did it
          before the Merge. Open any block to check it yourself.
        </p>
        <div className="stats">
          <div className="stat"><span className="stat__label">Height</span><span className="stat__value">{height}</span></div>
          <div className="stat"><span className="stat__label">Pending</span><span className="stat__value">{mempool.length}</span></div>
          <div className="stat"><span className="stat__label">Difficulty</span><span className="stat__value">{difficulty} zero{difficulty === 1 ? "" : "s"}</span></div>
          <div className="stat">
            <span className="stat__label">Last block</span>
            <span className="stat__value">{latest?.timestamp ? timeAgo(latest.timestamp) : "—"}</span>
          </div>
        </div>
      </section>

      <main className="grid">
        <section className="card controls">
          <header className="card__head">
            <h2>Miner</h2>
            {lastMiningTime !== null && (
              <span className="count">last block in {(lastMiningTime / 1000).toFixed(2)}s</span>
            )}
          </header>

          <div className="field">
            <div className="field__label">
              Difficulty <span className="muted">≈ {Math.pow(16, difficulty).toLocaleString()} hashes on average</span>
            </div>
            <div className="segmented" role="radiogroup" aria-label="Mining difficulty">
              {Array.from({ length: maxDifficulty }, (_, i) => i + 1).map((d) => (
                <button
                  key={d}
                  role="radio"
                  aria-checked={difficulty === d}
                  className={`segmented__item${difficulty === d ? " is-active" : ""}`}
                  onClick={() => handleDifficultyChange(d)}
                  disabled={someoneMining}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {someoneMining ? (
            <div className="mining">
              <div className="mining__row">
                <span className="pulse" /> {isLoadingBlock ? "Mining" : "Another visitor is mining"} block #{height + 1}
              </div>
              <div className="mining__nonce">{currentNonce.toLocaleString()}</div>
              <div className="mining__label">nonces tried</div>
              <div className="mining__hash">
                <span className="hash-prefix">0x</span>
                <span className="hash-zeros">{liveHex.slice(0, Math.min(matched, difficulty))}</span>
                <span className="mining__rest">{liveHex.slice(Math.min(matched, difficulty), 40) || "waiting…"}</span>
              </div>
              <div className="mining__label">target: 0x{target}…</div>
            </div>
          ) : (
            <p className="hint">
              Each extra zero makes a valid hash ~16× rarer. The live demo caps difficulty at {maxDifficulty} and stops
              mining after 60 seconds.
            </p>
          )}

          <div className="actions">
            <button className="btn btn--secondary" onClick={addTransaction} disabled={isLoadingTx || isLoadingBlock}>
              + Add transaction
            </button>
            {isLoadingBlock ? (
              <button className="btn btn--danger" onClick={stopMining}>
                ■ Stop mining
              </button>
            ) : (
              <button className="btn btn--primary" onClick={mineBlock} disabled={remoteMining}>
                {remoteMining ? "Waiting for that block…" : "⛏ Mine block"}
              </button>
            )}
          </div>
        </section>

        <MempoolView mempool={mempool} isLoading={isLoadingTx} onOpen={setOpenTx} />
      </main>

      <section className="card chain">
        <header className="card__head">
          <h2>
            Chain <span className="card__sub">click a block to see its transactions</span>
          </h2>
          <span className="count">
            {sortedBlocks.length > 0 && (
              <span className={`check ${firstInvalid < 0 ? "check--ok" : "check--bad"}`}>
                {firstInvalid < 0 ? "✓ verified in your browser" : `✗ block #${firstInvalid} fails verification`}
              </span>
            )}
            {sortedBlocks.length} blocks
            <button className="btn-link" onClick={deleteBlockchain} disabled={isDeleting}>
              reset
            </button>
          </span>
        </header>
        <div className="chain__scroll" ref={chainRef}>
          {sortedBlocks.map((block: BlockType, index: number) => (
            <BlockView
              key={block.hash ?? index}
              block={block}
              index={index}
              isNew={!!newBlockHash && block.hash === newBlockHash}
              valid={blockValid[index]}
              onOpen={() => setOpenBlock(index)}
            />
          ))}
          {someoneMining && (
            <article className="block block--mining">
              <header className="block__head">
                <span className="block__height">#{height + 1}</span>
                <span className="badge badge--live">mining</span>
              </header>
              <dl className="block__fields">
                <div><dt>Nonce</dt><dd className="mono">{currentNonce.toLocaleString()}</dd></div>
                <div><dt>Hash</dt><dd><HashText hash={currentMiningHash || undefined} /></dd></div>
              </dl>
            </article>
          )}
        </div>
      </section>

      <footer className="footer">
        Built by <a href="https://www.linkedin.com/in/realgalinganchev/" target="_blank" rel="noreferrer">Galin Ganchev</a>
        {" · "}TypeScript, React, Node.js · Runs on AWS (Terraform, GitHub Actions){" · "}
        <a href="https://github.com/realgalinganchev/blockchain101" target="_blank" rel="noreferrer">Source</a>
      </footer>

      {showSuccessPopup && successData && (
        <div className="toast" role="status">
          <div className="toast__title">Block mined</div>
          <div className="toast__body">
            nonce {parseInt(successData.nonce, 16).toLocaleString()} · difficulty {successData.difficulty}
            {lastMiningTime ? (
              <>
                {" "}
                · {(lastMiningTime / 1000).toFixed(2)}s · ≈{" "}
                {Math.round((parseInt(successData.nonce, 16) + 1) / (lastMiningTime / 1000)).toLocaleString()} hashes/s
              </>
            ) : null}
          </div>
          <HashText hash={successData.hash} head={10} tail={6} />
          <button type="button" className="toast__action" onClick={() => openBlockByHash(successData.hash)}>
            View block →
          </button>
        </div>
      )}

      {openBlock !== null && (
        <BlockModal blocks={sortedBlocks} index={openBlock} onNavigate={setOpenBlock} onClose={() => setOpenBlock(null)} />
      )}

      {openTx && (
        <Modal title="Pending transaction" onClose={() => setOpenTx(null)}>
          <TxDetails tx={openTx} />
          <p className="note">It leaves the mempool when a miner includes it in a block. Mine one to see where it lands.</p>
        </Modal>
      )}
    </div>
  );
};

export default App;
