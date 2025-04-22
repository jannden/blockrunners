import { Program } from "@coral-xyz/anchor";
import { useConnection } from "@solana/wallet-adapter-react";
import { useAnchorProvider } from "./useAnchorProvider";
import IDL from "@/idl/blockrunners.json";
import { Blockrunners } from "@/idl/blockrunners";
import { useEffect, useMemo, useState } from "react";
import * as sb from "@switchboard-xyz/on-demand";

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
      return new Program<Blockrunners>(IDL, provider);
    } else {
      // For read-only operations with no wallet
      return new Program<Blockrunners>(IDL, {
        connection,
      });
    }
  }, [connection, provider]);
}

export function useSwitchboardProgramPromise() {
  const provider = useAnchorProvider();

  return useMemo(() => {
    if (!provider) return undefined;

    const loadProgram = async () => {
      const sbProgramId = await sb.getProgramId(provider.connection);
      if (!sbProgramId) {
        throw new Error("Switchboard program ID not found");
      } else {
        console.log("Switchboard program ID", sbProgramId.toString());
      }
      const sbIdl = await Program.fetchIdl(sbProgramId, provider);
      if (!sbIdl) {
        throw new Error("Switchboard IDL not found");
      }
      const sbProgram = new Program(sbIdl!, provider);

      return sbProgram;
    };

    return loadProgram();
  }, [provider]);
}

export function useSwitchboardProgram() {
  const provider = useAnchorProvider();
  const [switchboardProgram, setSwitchboardProgram] = useState<Program | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!provider) {
      setSwitchboardProgram(null);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    const fetchProgram = async () => {
      try {
        const sbProgramId = await sb.getProgramId(provider.connection);
        if (!sbProgramId) {
          throw new Error("Switchboard program ID not found");
        } else {
          console.log("Switchboard program ID", sbProgramId.toString());
        }
        const sbIdl = await Program.fetchIdl(sbProgramId, provider);
        if (!sbIdl) {
          throw new Error("Switchboard IDL not found");
        }

        if (!sbIdl) {
          if (isMounted) {
            setError(new Error("IDL not found for program"));
            setIsLoading(false);
          }
          return;
        }

        // Create and return the program with the IDL
        const program = new Program(sbIdl, provider);

        if (isMounted) {
          setSwitchboardProgram(program);
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setIsLoading(false);
        }
      }
    };

    console.log("Fetching Switchboard program");

    fetchProgram();

    return () => {
      isMounted = false;
    };
  }, [provider]);

  return { switchboardProgram, isLoading, error };
}
