import * as anchor from "@coral-xyz/anchor";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { Blockrunners } from "../../target/types/blockrunners";
import { getStringFromByteArray } from "./utils";

// Access constants from IDL
const program = anchor.workspace.blockrunners as anchor.Program<Blockrunners>;
const constants = program.idl.constants;

// Numeric constants
export const CIPHER_COST = Number(constants.find((c) => c.name === "cipherCost")?.value);
export const INITIAL_PATH_LENGTH = Number(
  constants.find((c) => c.name === "initialPathLength")?.value
);
export const INITIAL_PRIZE_POOL = Number(
  constants.find((c) => c.name === "initialPrizePool")?.value
);
export const MAX_FEED_EVENTS = Number(
  constants.find((c) => c.name === "maxFeedEvents")?.value
);

// String constants stored as byte arrays
export const GAME_STATE_SEED = getStringFromByteArray(
  constants.find((c) => c.name === "gameStateSeed")?.value
);
export const PLAYER_STATE_SEED = getStringFromByteArray(
  constants.find((c) => c.name === "playerStateSeed")?.value
);

// Error codes
export const CONSTRAINT_SEEDS = "ConstraintSeeds";