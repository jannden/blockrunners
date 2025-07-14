import { PublicKey } from "@solana/web3.js";
import { createContext, useContext } from "react";
import { gameStatePDA } from "../lib/constants";
import { GameState, PlayerState, CardUsage } from "../lib/types";
import { AbilityCard } from "@/lib/types";

// Define the types for React context
interface BlockrunnersContextType {
  gameState: GameState | null;
  playerState: PlayerState | null;
  gameStatePDA: PublicKey | null;
  playerStatePDA: PublicKey | null;
  // UI state
  selectedCards: AbilityCard[];
  setSelectedCards: (cards: AbilityCard[]) => void;
  socialFeed: { id: string; message: string; timestamp: number; isNew: boolean }[];
  setSocialFeed: (
    feed: { id: string; message: string; timestamp: number; isNew: boolean }[]
  ) => void;
  // Card usage for blockchain transactions
  cardUsage: CardUsage;
  setCardUsage: (cardUsage: CardUsage) => void;
  // Game actions
  purchaseCiphers: (amount: number) => Promise<void>;
  // UI actions
  selectCard: (card: AbilityCard) => void;
  deselectCard: (cardId: string) => void;
}

// Create context with default values
export const BlockrunnersContext = createContext<BlockrunnersContextType>({
  gameState: null,
  playerState: null,
  gameStatePDA: gameStatePDA,
  playerStatePDA: null,
  // UI state
  selectedCards: [],
  setSelectedCards: () => {},
  socialFeed: [],
  setSocialFeed: () => {},
  // Card usage
  cardUsage: { shield: false, doubler: false, swift: false },
  setCardUsage: () => {},
  // Game actions
  purchaseCiphers: async () => {},
  // UI actions
  selectCard: () => {},
  deselectCard: () => {},
});

export const useBlockrunners = () => useContext(BlockrunnersContext);
