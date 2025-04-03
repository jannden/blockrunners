import { create } from "zustand";
import { AnchorProvider, Program, BN } from "@coral-xyz/anchor";
import { PublicKey, LAMPORTS_PER_SOL, Transaction, VersionedTransaction } from "@solana/web3.js";
import { useWalletStore } from "./wallet-store";

// Import IDL and constants
import IDL from "../idl/blockrunners.json";
import { Blockrunners } from "@/idl/blockrunners";
import { GAME_STATE_SEED, PLAYER_STATE_SEED } from "./constants";

// Type definitions for our account structures
interface GameState {
  authority: PublicKey;
  prizePool: BN;
  pathLength: number;
  gameEvents: Record<string, unknown>[];
}

interface PlayerState {
  player: PublicKey;
  ciphers: BN;
  cards: BN;
  position: number;
  path: Record<string, unknown>[];
  bump: number;
  playerEvents: Record<string, unknown>[];
}

// Define a wallet interface compatible with Anchor
interface Wallet {
  publicKey: PublicKey;
  signTransaction: <T extends Transaction | VersionedTransaction>(tx: T) => Promise<T>;
  signAllTransactions: <T extends Transaction | VersionedTransaction>(txs: T[]) => Promise<T[]>;
}

interface ProgramState {
  // Program connection
  program: Program<Blockrunners> | null;
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;

  // Game state data
  gameStatePublicKey: PublicKey | null;
  gameState: GameState | null;
  playerStatePublicKey: PublicKey | null;
  playerState: PlayerState | null;
  prizePool: number;

  // Actions
  initializeConnection: () => Promise<void>;
  initializePlayer: () => Promise<void>;
  purchaseCiphers: (amount: number) => Promise<boolean>;
  makeMove: (direction: "left" | "right") => Promise<boolean>;
  fetchGameState: () => Promise<void>;
  fetchPlayerState: () => Promise<void>;
}

export const useProgramStore = create<ProgramState>((set, get) => ({
  // Initial state
  program: null,
  isInitialized: false,
  isLoading: false,
  error: null,
  gameStatePublicKey: null,
  gameState: null,
  playerStatePublicKey: null,
  playerState: null,
  prizePool: 0,

  // Initialize connection to the program
  initializeConnection: async () => {
    const { connection, publicKey, connected } = useWalletStore.getState();

    // Check if wallet is connected
    if (!connected || !publicKey) {
      set({ error: "Wallet not connected" });
      return;
    }

    set({ isLoading: true, error: null });

    try {
      // Create a wallet adapter that satisfies the Wallet interface
      const wallet: Wallet = {
        publicKey,
        signTransaction: async <T extends Transaction | VersionedTransaction>(
          tx: T
        ): Promise<T> => {
          // In a real implementation, this would call the wallet's signTransaction method
          return tx;
        },
        signAllTransactions: async <T extends Transaction | VersionedTransaction>(
          txs: T[]
        ): Promise<T[]> => {
          // In a real implementation, this would call the wallet's signAllTransactions method
          return txs;
        },
      };

      // Create an Anchor provider
      const provider = new AnchorProvider(connection, wallet, {
        preflightCommitment: "processed",
        commitment: "processed",
      });

      // Create the program instance with the proper typing
      const program = new Program<Blockrunners>(IDL, provider);

      // Derive the game state PDA
      const [gameStatePublicKey] = PublicKey.findProgramAddressSync(
        [GAME_STATE_SEED],
        program.programId
      );

      // Derive the player state PDA
      const [playerStatePublicKey] = PublicKey.findProgramAddressSync(
        [PLAYER_STATE_SEED, publicKey.toBuffer()],
        program.programId
      );

      set({
        program,
        isInitialized: true,
        gameStatePublicKey,
        playerStatePublicKey,
      });

      // Fetch the game and player state
      await get().fetchGameState();
      await get().fetchPlayerState();
    } catch (err) {
      const error = err as Error;
      console.error("Failed to initialize program connection:", error);
      set({ error: `Failed to initialize: ${error.message || "Unknown error"}` });
    } finally {
      set({ isLoading: false });
    }
  },

  // Initialize player if not already initialized
  initializePlayer: async () => {
    const { program, playerState, playerStatePublicKey } = get();
    const { publicKey } = useWalletStore.getState();

    if (!program || !publicKey || !playerStatePublicKey) {
      set({ error: "Program not initialized or wallet not connected" });
      return;
    }

    // Only initialize if player state does not exist yet
    if (!playerState) {
      set({ isLoading: true, error: null });

      try {
        // Call the initialize_player instruction
        const tx = await program.methods
          .initializePlayer()
          .accounts({
            player: publicKey,
          })
          .rpc();

        console.log("Player initialized with tx:", tx);

        // Fetch updated player state
        await get().fetchPlayerState();
      } catch (err) {
        const error = err as Error;
        console.error("Failed to initialize player:", error);
        set({ error: `Failed to initialize player: ${error.message || "Unknown error"}` });
      } finally {
        set({ isLoading: false });
      }
    }
  },

  // Purchase ciphers
  purchaseCiphers: async (amount: number) => {
    const { program, gameStatePublicKey, playerStatePublicKey } = get();
    const { publicKey } = useWalletStore.getState();

    if (!program || !publicKey || !gameStatePublicKey || !playerStatePublicKey) {
      set({ error: "Program not initialized or wallet not connected" });
      return false;
    }

    set({ isLoading: true, error: null });

    try {
      // Call the purchase_ciphers instruction
      const tx = await program.methods
        .purchaseCiphers(new BN(amount))
        .accounts({
          player: publicKey,
        })
        .rpc();

      console.log("Purchased ciphers with tx:", tx);

      // Fetch updated states
      await get().fetchGameState();
      await get().fetchPlayerState();

      return true;
    } catch (err) {
      const error = err as Error;
      console.error("Failed to purchase ciphers:", error);
      set({ error: `Failed to purchase ciphers: ${error.message || "Unknown error"}` });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  // Make a move
  makeMove: async (direction: "left" | "right") => {
    const { program, playerStatePublicKey } = get();
    const { publicKey } = useWalletStore.getState();

    if (!program || !publicKey || !playerStatePublicKey) {
      set({ error: "Program not initialized or wallet not connected" });
      return false;
    }

    set({ isLoading: true, error: null });

    try {
      // Call the make_move instruction
      const tx = await program.methods
        .makeMove(direction === "left" ? { left: {} } : { right: {} })
        .rpc();

      console.log("Made move with tx:", tx);

      // Fetch updated player state
      await get().fetchPlayerState();

      return true;
    } catch (err) {
      const error = err as Error;
      console.error("Failed to make move:", error);
      set({ error: `Failed to make move: ${error.message || "Unknown error"}` });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  // Fetch the game state
  fetchGameState: async () => {
    const { program, gameStatePublicKey } = get();

    if (!program || !gameStatePublicKey) {
      return;
    }

    try {
      // Using snake_case to match IDL account naming
      const gameState = await program.account.gameState.fetch(gameStatePublicKey);

      set({
        gameState: gameState as unknown as GameState,
        prizePool: gameState.prizePool.toNumber() / LAMPORTS_PER_SOL,
      });

      console.log("Fetched game state:", gameState);
    } catch (error) {
      console.error("Failed to fetch game state:", error);
      // Don't set error state as this could be a normal case when game is not initialized
    }
  },

  // Fetch the player state
  fetchPlayerState: async () => {
    const { program, playerStatePublicKey } = get();
    const { publicKey } = useWalletStore.getState();

    if (!program || !playerStatePublicKey || !publicKey) {
      return;
    }

    try {
      // Using snake_case to match IDL account naming
      const playerState = await program.account.playerState.fetch(playerStatePublicKey);
      set({ playerState: playerState as unknown as PlayerState });
      console.log("Fetched player state:", playerState);
    } catch (error) {
      console.error("Failed to fetch player state:", error);
      // Don't set error state as this could be a normal case when player is not initialized
    }
  },
}));
