/** Chain id signed into every transaction (EIP-155), so a signature can't be replayed on another chain. 1337 is the usual local devnet id. */
export const CHAIN_ID = 1337;

/** Most transactions one block takes from the mempool. */
export const MAX_TRANSACTIONS = 10;

/** A plain ETH transfer costs exactly this much gas. */
export const TRANSFER_GAS = 21000;

/** Upper bound for a raw signed transaction; a transfer is ~110 bytes. */
export const MAX_RAW_TX_BYTES = 1024;
