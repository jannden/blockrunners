/**
 * Utility functions for working with Anchor programs
 */

import { Program } from "@coral-xyz/anchor";
import { BN } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { useWalletStore } from "./wallet-store";
import { useProgramStore } from "./program-store";
import { Blockrunners } from "@/idl/blockrunners";

/**
 * Get the on-chain program instance
 * @returns The program instance if initialized, null otherwise
 */
export function getProgram(): Program<Blockrunners> | null {
  const { program, isInitialized } = useProgramStore.getState();

  if (!isInitialized || !program) {
    return null;
  }

  return program;
}

/**
 * Check if a wallet is connected and return wallet state
 * @returns An object with connected status and public key
 */
export function getWalletState(): { connected: boolean; publicKey: PublicKey | null } {
  const { connected, publicKey } = useWalletStore.getState();
  return { connected, publicKey };
}

/**
 * Create a BN from a number for use with the program
 * @param amount The amount to convert to BN
 * @returns A BN instance
 */
export function toBN(amount: number): BN {
  return new BN(amount);
}

/**
 * Handle unknown errors and extract message
 * @param error The unknown error to handle
 * @returns A formatted error message
 */
export function handleError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

/**
 * Add a message to the social feed of the program after transactions
 * @param message The message to add
 */
export function addMessageToFeed(message: string) {
  // This function can be expanded to add messages to the on-chain feed in the future
  console.log(`[FEED] ${message}`);
}
