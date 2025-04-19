import { AnchorProvider } from "@coral-xyz/anchor";
import { useConnection, useAnchorWallet } from "@solana/wallet-adapter-react";
import { useEffect } from "react";

export function useAnchorProvider() {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  // Debug logs
  useEffect(() => {
    console.log("useAnchorProvider - Wallet connected:", !!wallet);
    console.log("useAnchorProvider - Connection available:", !!connection);

    if (wallet) {
      console.log("Wallet public key:", wallet.publicKey.toString());
    }
  }, []);

  if (!wallet) {
    console.log("No wallet, returning null provider");
    return null;
  }

  try {
    const provider = new AnchorProvider(connection, wallet, {
      preflightCommitment: "processed",
      commitment: "processed",
    });
    console.log("AnchorProvider created successfully");
    return provider;
  } catch (error) {
    console.error("Error creating AnchorProvider:", error);
    return null;
  }
}
