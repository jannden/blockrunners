export type CardType = "shield" | "doubler" | "swift";
// test
export interface AbilityCard {
  id: string;
  type: CardType;
  name: string;
  description: string;
  icon: string;
  used: boolean;
  result: string | null;
}

export interface FeedMessage {
  id: string;
  message: string;
  timestamp: number;
  isNew: boolean;
}

export interface GameState {
  position: number;
  totalBlocks: number;
  progress: number;
  prizePool: number;
}

export interface PlayerState {
  id: string;
  name: string;
  position: number;
  ciphers: number;
  cards: AbilityCard[];
}

export type Direction = "left" | "right";
