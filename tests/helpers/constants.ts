import { getStringFromByteArray, getConstantOrThrow } from "./utils";
import { BN } from "@coral-xyz/anchor";

// Number constants
export const CIPHER_COST = new BN(getConstantOrThrow("cipherCost")).toNumber();
export const INITIAL_PATH_LENGTH = Number(getConstantOrThrow("initialPathLength"));
export const MAX_FEED_EVENTS = Number(getConstantOrThrow("maxFeedEvents"));
export const INITIAL_PRIZE_POOL = new BN(getConstantOrThrow("initialPrizePool")).toNumber();

// String constants stored as byte arrays
export const GAME_STATE_SEED = getStringFromByteArray(getConstantOrThrow("gameStateSeed"));
export const PLAYER_STATE_SEED = getStringFromByteArray(getConstantOrThrow("playerStateSeed"));

// Error codes
export const CONSTRAINT_SEEDS = "ConstraintSeeds";
