import { useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Button } from "./ui/button";
import { useProgram } from "@/hooks/useProgram";

export const InitPlayerButton = () => {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const [isLoading, setIsLoading] = useState(false);
  const program = useProgram();

  const handleInitPlayer = async () => {
    if (!publicKey || !program) return;

    setIsLoading(true);

    try {
      const latestBlockHash = await connection.getLatestBlockhash();

      const signature = await program.methods
        .initializePlayer()
        .accounts({
          player: publicKey,
        })
        .rpc();

      console.log("Initialize player: Transaction sent", signature);

      // Wait to confirm the transaction
      const confirmResult = await connection.confirmTransaction({
        blockhash: latestBlockHash.blockhash,
        lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
        signature,
      });

      if (confirmResult) {
        console.log("Initialize player transaction was confirmed");
      }
    } catch (err) {
      console.error("Initialize player error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button onClick={handleInitPlayer} disabled={isLoading}>
      {isLoading ? "Loading..." : "Init Player"}
    </Button>
  );
};
