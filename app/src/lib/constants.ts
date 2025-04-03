import * as anchor from "@coral-xyz/anchor";
import { Blockrunners } from "@/idl/blockrunners";
import { getStringFromByteArray } from "./utils";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import IDL from "@/idl/blockrunners.json";

// Access constants from IDL
const program = anchor.workspace.blockrunners as anchor.Program<Blockrunners>;
const constants = program.idl.constants;

// Program ID
export const PROGRAM_ID = new PublicKey(IDL.address);

// Seeds for PDAs
export const GAME_STATE_SEED = Buffer.from("game_state");
export const PLAYER_STATE_SEED = Buffer.from("player_state");

// Constants from IDL
export const CIPHER_COST =
  new BN(IDL.constants.find((c) => c.name === "CIPHER_COST")?.value || "1000000").toNumber() /
  LAMPORTS_PER_SOL; // Convert lamports to SOL

export const INITIAL_PATH_LENGTH = Number(
  IDL.constants.find((c) => c.name === "INITIAL_PATH_LENGTH")?.value || "20"
);

export const INITIAL_PLAYER_CARDS_AMOUNT = Number(
  IDL.constants.find((c) => c.name === "INITIAL_PLAYER_CARDS_AMOUNT")?.value || "1"
);

export const MAX_FEED_EVENTS = Number(
  IDL.constants.find((c) => c.name === "MAX_FEED_EVENTS")?.value || "20"
);

export const INITIAL_PRIZE_POOL =
  new BN(IDL.constants.find((c) => c.name === "INITIAL_PRIZE_POOL")?.value || "0").toNumber() /
  LAMPORTS_PER_SOL;

// String constants stored as byte arrays
export const GAME_STATE_SEED_STR = getStringFromByteArray(
  constants.find((c) => c.name === "gameStateSeed")?.value
);
export const PLAYER_STATE_SEED_STR = getStringFromByteArray(
  constants.find((c) => c.name === "playerStateSeed")?.value
);

// Error codes
export const CONSTRAINT_SEEDS = "ConstraintSeeds";
