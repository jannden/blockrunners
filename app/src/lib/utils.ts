import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import * as anchor from "@coral-xyz/anchor";
import { Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Airdrops SOL to a given wallet
 * @param provider The Anchor provider
 * @param recipient The wallet to receive the SOL
 * @param amount Amount in SOL to airdrop (default: 1 SOL)
 * @returns Promise that resolves when the airdrop is confirmed
 */
export const airdropSol = async (
  provider: anchor.Provider,
  recipient: Keypair,
  amount: number = 1
): Promise<void> => {
  try {
    const airdropSignature = await provider.connection.requestAirdrop(
      recipient.publicKey,
      amount * LAMPORTS_PER_SOL
    );
    const latestBlockHash = await provider.connection.getLatestBlockhash();

    await provider.connection.confirmTransaction({
      blockhash: latestBlockHash.blockhash,
      lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
      signature: airdropSignature,
    });
    console.log(`Airdropped ${amount} SOL to ${recipient.publicKey.toString()}`);
  } catch (error) {
    console.error("Airdrop failed:", error);
    throw error;
  }
};

/**
 * Converts a byte array encoded as a string to a string
 * @param byteArray The byte array to convert encoded as a string
 * @returns The string representation of the byte array
 */
export function getStringFromByteArray(byteArray: string | undefined): string {
  if (!byteArray) {
    return "";
  }
  return Buffer.from(JSON.parse(byteArray)).toString("utf8");
}

/**
 * Get logs from program's msg! macro obtained from a transaction
 * @param provider The Anchor provider
 * @param signature The transaction signature
 * @returns Promise that resolves with the filtered program logs
 */
export const getMsgLogs = async (
  provider: anchor.Provider,
  txSignature: string
): Promise<string[] | null> => {
  try {
    // Confirm the transaction first
    const latestBlockHash = await provider.connection.getLatestBlockhash();
    await provider.connection.confirmTransaction(
      {
        blockhash: latestBlockHash.blockhash,
        lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
        signature: txSignature,
      },
      "confirmed"
    );

    // Get transaction details
    const txDetails = await provider.connection.getTransaction(txSignature, {
      maxSupportedTransactionVersion: 0,
      commitment: "confirmed",
    });

    // Extract and filter logs
    const logs = txDetails?.meta?.logMessages
      ?.filter((log) => log.includes("Program log:"))
      .map((log) => log.replace("Program log: ", ""));

    return logs || null;
  } catch (error) {
    console.error("Failed to get transaction logs:", error);
    return null;
  }
};
