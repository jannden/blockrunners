import { Program } from "@coral-xyz/anchor";
import { useConnection } from "@solana/wallet-adapter-react";
import { useAnchorProvider } from "./useAnchorProvider";
import IDL from "@/idl/blockrunners.json";
import { Blockrunners } from "@/idl/blockrunners";
import { useMemo } from "react";

/**
 * Hook to get the Anchor Program instance
 * @returns The Anchor Program instance, properly configured with a provider for transactions
 */
export function useProgram() {
  const { connection } = useConnection();
  const provider = useAnchorProvider();

  return useMemo(() => {
    if (provider) {
      // For write operations with wallet connected
      return new Program<Blockrunners>(IDL as Blockrunners, provider);
    } else {
      // For read-only operations with no wallet
      return new Program<Blockrunners>(IDL as Blockrunners, {
        connection,
      });
    }
  }, [connection, provider]);
}
