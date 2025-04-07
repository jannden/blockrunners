import { AnchorProvider } from "@coral-xyz/anchor";
import { useConnection, useWallet, AnchorWallet } from "@solana/wallet-adapter-react";

export function useAnchorProvider() {
  const { connection } = useConnection();
  const wallet = useWallet();

  return new AnchorProvider(connection, wallet as AnchorWallet, {
    commitment: "confirmed",
  });
}
