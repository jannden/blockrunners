import * as anchor from "@coral-xyz/anchor";
import { BorshCoder, EventParser, Program } from "@coral-xyz/anchor";
import { Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { Blockrunners } from "../../target/types/blockrunners";

// Access constants from IDL
const program = anchor.workspace.blockrunners as anchor.Program<Blockrunners>;
const IDL = program.idl;

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
 * Get a constant from the IDL or throw an error if it's not found
 * @param name The name of the constant
 * @returns The value of the constant
 */
export const getConstantOrThrow = (name: string) => {
  const constant = IDL.constants.find((c) => c.name === name)?.value;
  if (constant === undefined) {
    throw new Error(`${name} not found in IDL constants`);
  }
  return constant;
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
 * Get transaction details
 * @param provider The Anchor provider
 * @param txSignature The transaction signature
 * @returns Promise that resolves with the transaction details
 */
export const getTxDetails = async (provider: anchor.Provider, txSignature: string) => {
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
    return txDetails;
  } catch (error) {
    console.error("Failed to get transaction details:", error);
    return null;
  }
};

/**
 * Get logs from program's msg! macro obtained from a transaction
 * @param provider The Anchor provider
 * @param signature The transaction signature
 * @returns Promise that resolves with the filtered program logs
 */
export const getMsgLogs = async (
  txDetails: anchor.web3.VersionedTransactionResponse
): Promise<string[] | null> => {
  try {
    const logs = txDetails?.meta?.logMessages
      ?.filter((log) => log.includes("Program log:"))
      .map((log) => log.replace("Program log: ", ""));

    return logs || null;
  } catch (error) {
    console.error("Failed to get transaction logs:", error);
    return null;
  }
};

/**
 * Get logs from program's msg! macro obtained from a transaction
 * @param provider The Anchor provider
 * @param signature The transaction signature
 * @returns Promise that resolves with the filtered program logs
 */
export const getEventLogs = async (
  txDetails: anchor.web3.VersionedTransactionResponse
): Promise<string[] | null> => {
  try {
    const eventParser = new EventParser(program.programId, new BorshCoder(program.idl));
    const events = eventParser.parseLogs(txDetails.meta.logMessages);
    let eventLogs: string[] = [];
    for (let event of events) {
      eventLogs.push(`${event.name}: ${event.data?.message}`);
    }

    return eventLogs || null;
  } catch (error) {
    console.error("Failed to get transaction logs:", error);
    return null;
  }
};

/**
 * Gives a card to a player in the test environment.
 * @param program Anchor program client.
 * @param playerKeypair Player's keypair.
 * @param playerStatePda PDA for player's state.
 * @param card Card object (e.g., { shield: {} }).
 */
export const giveCard = async (
  program: Program<Blockrunners>,
  playerKeypair: Keypair,
  playerStatePda: anchor.web3.PublicKey,
  card: any
) => {
  await program.methods
    .debugGiveCard(card) // assumes debug-only method for test env
    .accounts({
      player: playerKeypair.publicKey,
    })
    .signers([playerKeypair])
    .rpc();
};

export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
