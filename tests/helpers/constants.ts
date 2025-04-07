import * as anchor from "@coral-xyz/anchor";
import { Blockrunners } from "../../target/types/blockrunners";
import { getStringFromByteArray, getConstantOrThrow } from "./utils";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";

// Access constants from IDL
const program = anchor.workspace.blockrunners as anchor.Program<Blockrunners>;
const IDL = program.idl;

// Number constants
export const CIPHER_COST = new BN(getConstantOrThrow("CIPHER_COST")).toNumber() / LAMPORTS_PER_SOL;
export const INITIAL_PATH_LENGTH = Number(getConstantOrThrow("INITIAL_PATH_LENGTH"));
export const INITIAL_PLAYER_CARDS_AMOUNT = Number(getConstantOrThrow("INITIAL_PLAYER_CARDS_AMOUNT"));
export const MAX_FEED_EVENTS = Number(getConstantOrThrow("MAX_FEED_EVENTS"));
export const INITIAL_PRIZE_POOL =
  new BN(getConstantOrThrow("INITIAL_PRIZE_POOL")).toNumber() / LAMPORTS_PER_SOL;

// String constants stored as byte arrays
export const GAME_STATE_SEED = getStringFromByteArray(getConstantOrThrow("gameStateSeed"));
export const PLAYER_STATE_SEED = getStringFromByteArray(getConstantOrThrow("playerStateSeed"));

// Error codes
export const CONSTRAINT_SEEDS = "ConstraintSeeds";
