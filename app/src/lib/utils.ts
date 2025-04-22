import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import * as anchor from "@coral-xyz/anchor";
import { Keypair, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import * as sb from "@switchboard-xyz/on-demand";
import IDL from "@/idl/blockrunners.json";
import { AbilityCard } from "@/lib/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function lamportsShortString(lamports: number): string {
  if (lamports >= 1_000_000_000) {
    return `${(lamports / 1_000_000_000).toFixed(3)} SOL`;
  } else if (lamports >= 1_000_000) {
    return `${(lamports / 1_000_000).toFixed(3)}M lamports`;
  } else if (lamports >= 1_000) {
    return `${(lamports / 1_000).toFixed(0)}K lamports`;
  } else {
    return lamports.toFixed(0) + " lamports";
  }
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

export async function loadSVMSwitchboardProgram(
  provider: anchor.Provider
): Promise<anchor.Program> {
  const svmProgramId = sb.ON_DEMAND_MAINNET_PID;
  const svmIdl = await anchor.Program.fetchIdl(svmProgramId, provider);
  const svmProgram = new anchor.Program(svmIdl!, provider);
  return svmProgram;
}

export async function setupQueue(program: anchor.Program): Promise<PublicKey> {
  const queueAccount = await sb.getDefaultQueue(program.provider.connection.rpcEndpoint);
  console.log("Queue account", queueAccount.pubkey.toString());
  try {
    await queueAccount.loadData();
  } catch (err) {
    console.error("Queue not found, ensure you are using devnet in your env", err);
    process.exit(1);
  }
  return queueAccount.pubkey;
}

export async function setupSVMQueue(program: anchor.Program, queue: PublicKey): Promise<PublicKey> {
  const queuePDA = sb.Queue.queuePDA(program, queue);
  console.log("Queue:", queuePDA.toString());

  try {
    // Try to fetch queue data to verify it exists
    const queueAccountInfo = await program.provider.connection.getAccountInfo(queuePDA);
    if (!queueAccountInfo) {
      throw new Error("SVM Queue account not found");
    }

    // Check if the account is owned by the expected program
    if (!queueAccountInfo.owner.equals(program.programId)) {
      throw new Error("SVM Queue is not owned by the expected program");
    }
  } catch (err) {
    console.error("SVM Queue not found or not properly initialized:", err);
    throw new Error("Failed to setup SVM Queue. Please check your configuration and network.");
  }

  return queuePDA;
}

// Card helper functions
export const getCardDescription = (type: string): string => {
  switch (type) {
    case "shield":
      return "Protects you from a wrong move.";
    case "doubler":
      return "Awards two cards instead of one on a correct move.";
    case "swift":
      return "Reduces your move cost by 2.";
    default:
      return "Unknown card type";
  }
};

export const getCardIcon = (type: string): string => {
  switch (type) {
    case "shield":
      return "🛡️";
    case "doubler":
      return "✌️";
    case "swift":
      return "⚡";
    default:
      return "❓";
  }
};

// Generate a random ID for cards and messages
export const generateId = () => Math.random().toString(36).substring(2, 11);

// Convert blockchain card data to client-side AbilityCard format
export const transformBlockchainCards = (cards: unknown[] | undefined): AbilityCard[] => {
  if (!cards || !Array.isArray(cards)) return [];

  return cards.map((card, index) => {
    // Determine the card type from the blockchain data
    let cardType: "shield" | "doubler" | "swift" = "shield";

    // Use type checking to determine the card type
    if (typeof card === "object" && card !== null) {
      if ("shield" in card) {
        cardType = "shield";
      } else if ("doubler" in card) {
        cardType = "doubler";
      } else if ("swift" in card) {
        cardType = "swift";
      }
    }

    return {
      id: `${cardType}-${index}-${generateId()}`,
      type: cardType,
      name: cardType.charAt(0).toUpperCase() + cardType.slice(1),
      description: getCardDescription(cardType),
      icon: getCardIcon(cardType),
      used: false,
      result: null,
    };
  });
};
