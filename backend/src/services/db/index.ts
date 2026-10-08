import { Store } from "./store";
import { createMemoryStore } from "./memory";

require("dotenv").config();

/**
 * Firestore when credentials are configured (production, CI), otherwise an in-memory
 * store so the backend runs locally with no setup. STORE=memory forces memory.
 */
function selectStore(): Store {
  if (process.env.STORE !== "memory" && process.env.FIREBASE_PROJECT_ID) {
    // Required lazily: importing firebaseInit connects to Firebase.
    return require("./firestore").firestoreStore;
  }
  console.log("No Firebase credentials (or STORE=memory): keeping the chain in memory. It resets on restart.");
  return createMemoryStore();
}

export const store: Store = selectStore();
