/** What the node broadcasts to every open /mining-progress stream. */
export type ChainEvent =
  | { type: "progress"; hash: string; nonce: number }
  | { type: "mining"; active: boolean }
  | { type: "block"; number: number; hash: string }
  | { type: "mempool"; size: number }
  | { type: "reset" };

type Listener = (event: ChainEvent) => void;
let listeners: Listener[] = [];

/** Returns the unsubscribe function. */
export function subscribe(listener: Listener): () => void {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

export function publish(event: ChainEvent) {
  listeners.forEach((listener) => listener(event));
}
