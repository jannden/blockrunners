import { Blockrunners } from "@/idl/blockrunners";
import { IdlAccounts } from "@coral-xyz/anchor";

export type GameState = IdlAccounts<Blockrunners>["gameState"];
export type PlayerState = IdlAccounts<Blockrunners>["playerState"];
export type Direction = "left" | "right";
export type CardType = "shield" | "doubler" | "swift";
