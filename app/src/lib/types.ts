import { Blockrunners } from "@/idl/blockrunners";
import { IdlAccounts, IdlEvents, IdlTypes } from "@coral-xyz/anchor";

export type GameState = IdlAccounts<Blockrunners>["gameState"];
export type PlayerState = IdlAccounts<Blockrunners>["playerState"];
export type PathDirection = IdlTypes<Blockrunners>["pathDirection"];
export type CardUsage = IdlTypes<Blockrunners>["cardUsage"];
export type SocialFeedEvent = IdlEvents<Blockrunners>["socialFeedEvent"];

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