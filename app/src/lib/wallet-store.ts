import { create } from "zustand";
import { Connection, PublicKey } from "@solana/web3.js";

// Get network RPC URL from environment variable
const SOLANA_ENDPOINT = import.meta.env.VITE_SOLANA_RPC_URL || "http://127.0.0.1:8899";

console.log(`Using Solana RPC URL: ${SOLANA_ENDPOINT}`);

interface WalletState {
  // Connection state
  connected: boolean;
  publicKey: PublicKey | null;
  connection: Connection;
  balance: number;
  isLoading: boolean;

  // Actions
  setConnected: (connected: boolean) => void;
  setPublicKey: (publicKey: PublicKey | null) => void;
  setBalance: (balance: number) => void;
  setLoading: (isLoading: boolean) => void;
  disconnect: () => void;
  refreshBalance: () => Promise<void>;
}

export const useWalletStore = create<WalletState>((set, get) => ({
  // Initial state
  connected: false,
  publicKey: null,
  connection: new Connection(SOLANA_ENDPOINT),
  balance: 0,
  isLoading: false,

  // Actions
  setConnected: (connected: boolean) => {
    set({ connected });
    if (!connected) {
      set({ publicKey: null, balance: 0 });
    }
  },

  setPublicKey: (publicKey: PublicKey | null) => {
    set({ publicKey });
    // Fetch balance when publicKey changes
    if (publicKey) {
      get().refreshBalance();
    }
  },

  setBalance: (balance: number) => {
    set({ balance });
  },

  setLoading: (isLoading: boolean) => {
    set({ isLoading });
  },

  disconnect: () => {
    set({
      connected: false,
      publicKey: null,
      balance: 0,
    });
  },

  refreshBalance: async () => {
    const { connection, publicKey } = get();
    if (!publicKey) return;

    set({ isLoading: true });
    try {
      const balance = await connection.getBalance(publicKey);
      set({ balance: balance / 1_000_000_000 }); // Convert lamports to SOL
    } catch (error) {
      console.error("Failed to fetch balance:", error);
    } finally {
      set({ isLoading: false });
    }
  },
}));
