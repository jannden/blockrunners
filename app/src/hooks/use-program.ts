import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Program, AnchorProvider } from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import IDL from "@/idl/blockrunners.json";
import { Blockrunners } from "@/idl/blockrunners";

const programId = new PublicKey("BsPD4M38GiLBKuDSNipaw6GCfNeJ3uyRngqYBpsiEXko");

// Get network RPC URL from environment variable
const rpcUrl = import.meta.env.VITE_SOLANA_RPC_URL || "http://127.0.0.1:8899";

export function useProgram() {
  const { publicKey, signTransaction, signAllTransactions, connected } = useWallet();
  const [program, setProgram] = useState<Program<Blockrunners> | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!connected || !publicKey || !signTransaction || !signAllTransactions) {
      setProgram(null);
      setIsInitialized(false);
      return;
    }

    try {
      // Create connection
      const connection = new Connection(rpcUrl, "processed");

      // Create provider
      const provider = new AnchorProvider(
        connection,
        {
          publicKey,
          signTransaction,
          signAllTransactions,
        },
        { commitment: "processed" }
      );

      // Create program instance
      const programInstance = new Program<Blockrunners>(IDL, provider);

      console.log("Program initialized:", programInstance.programId.toString());

      setProgram(programInstance);
      setIsInitialized(true);
      setError(null);
    } catch (err) {
      console.error("Failed to initialize program:", err);
      setError("Failed to initialize program");
      setProgram(null);
      setIsInitialized(false);
    }
  }, [connected, publicKey, signTransaction, signAllTransactions]);

  return {
    program,
    programId,
    isInitialized,
    error,
    connected,
  };
}
