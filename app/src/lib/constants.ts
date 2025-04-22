import { getConstantOrThrow, getStringFromByteArray } from "@/lib/utils";
import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import IDL from "@/idl/blockrunners.json";

// Program ID
export const PROGRAM_ID = new PublicKey(IDL.address);

// Number constants from IDL
export const CIPHER_COST = new BN(getConstantOrThrow("CIPHER_COST")).toNumber();
export const INITIAL_PATH_LENGTH = Number(getConstantOrThrow("INITIAL_PATH_LENGTH"));
export const MAX_FEED_EVENTS = Number(getConstantOrThrow("MAX_FEED_EVENTS"));
export const INITIAL_PRIZE_POOL = new BN(getConstantOrThrow("INITIAL_PRIZE_POOL")).toNumber();

// String constants from IDL stored as byte arrays
export const GAME_STATE_SEED = getStringFromByteArray(getConstantOrThrow("GAME_STATE_SEED"));
export const PLAYER_STATE_SEED = getStringFromByteArray(getConstantOrThrow("PLAYER_STATE_SEED"));

// PDAs
export const [gameStatePDA] = PublicKey.findProgramAddressSync(
  [Buffer.from(GAME_STATE_SEED)],
  PROGRAM_ID
);

export const getPlayerStatePDA = (publicKey: PublicKey) => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(PLAYER_STATE_SEED), publicKey.toBuffer()],
    PROGRAM_ID
  )[0];
};