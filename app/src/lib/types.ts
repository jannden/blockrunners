import { Blockrunners } from "@/idl/blockrunners";
import { IdlAccounts, IdlEvents, IdlTypes } from "@coral-xyz/anchor";

// Accounts
export type GameState = IdlAccounts<Blockrunners>["gameState"];
export type PlayerState = IdlAccounts<Blockrunners>["playerState"];

// Events
export type SocialFeedEvent = IdlEvents<Blockrunners>["socialFeedEvent"];

// Types
export type Card = IdlTypes<Blockrunners>["card"];
export type CardUsage = IdlTypes<Blockrunners>["cardUsage"];
export type PathDirection = IdlTypes<Blockrunners>["pathDirection"];
export type SocialFeedEventType = IdlTypes<Blockrunners>["socialFeedEventType"];

// Custom Frontend Types
export type SocialFeedEventInState = {
  id: string;
  message: string;
  timestamp: number;
  isNew: boolean;
};
export type CardType = "shield" | "doubler" | "swift";
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