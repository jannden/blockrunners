import { PublicKey } from "@solana/web3.js";
import { createContext, useContext } from "react";
import { gameStatePDA } from "../lib/constants";
import { GameState, PlayerState } from "../types/types";
import type { Direction } from "../types/types";
import { Program } from "@coral-xyz/anchor";

// Define the types for React context
interface BlockrunnersContextType {
  program: Program | null;
  gameState: GameState | null;
  playerState: PlayerState | null;
  gameStatePDA: PublicKey | null;
  playerStatePDA: PublicKey | null;
  isProcessing: boolean;
  initializeGame: () => Promise<void>;
  initializePlayer: () => Promise<void>;
  purchaseCiphers: (amount: number) => Promise<void>;
  makeMove: (direction: Direction) => Promise<void>;
}

// Create context with default values
export const BlockrunnersContext = createContext<BlockrunnersContextType>({
  program: null,
  gameState: null,
  playerState: null,
  gameStatePDA: gameStatePDA,
  playerStatePDA: null,
  isProcessing: false,
  initializeGame: async () => {},
  initializePlayer: async () => {},
  purchaseCiphers: async () => {},
  makeMove: async () => {},
});

export const useBlockrunners = () => useContext(BlockrunnersContext);
