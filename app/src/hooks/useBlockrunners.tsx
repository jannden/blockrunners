import { PublicKey } from "@solana/web3.js";
import { createContext, useContext } from "react";
import { gameStatePDA } from "../lib/constants";
import { GameState, PlayerState } from "../types/types";
import type { Direction, SocialFeedEvent } from "../types/types";

// Define the types for React context
interface BlockrunnersContextType {
  gameState: GameState | null;
  playerState: PlayerState | null;
  gameStatePDA: PublicKey | null;
  playerStatePDA: PublicKey | null;
  socialFeeds: SocialFeedEvent[];
  initializeGame: () => Promise<void>;
  initializePlayer: () => Promise<void>;
  purchaseCiphers: (amount: number) => Promise<void>;
  makeMove: (direction: Direction) => Promise<void>;
  requestRandomness: () => Promise<void>;
  revealRandomness: () => Promise<void>;
}

// Create context with default values
export const BlockrunnersContext = createContext<BlockrunnersContextType>({
  gameState: null,
  playerState: null,
  gameStatePDA: gameStatePDA,
  playerStatePDA: null,
  socialFeeds: [],
  initializeGame: async () => {},
  initializePlayer: async () => {},
  purchaseCiphers: async () => {},
  makeMove: async () => {},
  requestRandomness: async () => undefined,
  revealRandomness: async () => undefined,
});

export const useBlockrunners = () => useContext(BlockrunnersContext);
