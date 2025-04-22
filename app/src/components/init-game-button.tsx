import { useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Button } from "./ui/button";
import { useProgram } from "@/hooks/useProgram";

export const InitGameButton = () => {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const [isLoading, setIsLoading] = useState(false);
  const program = useProgram();

  const handleInitGame = async () => {
    if (!publicKey || !program) return;

    setIsLoading(true);

    try {
      const latestBlockHash = await connection.getLatestBlockhash();

      const signature = await program.methods
        .initializeGame()
        .accounts({
          admin: publicKey,
        })
        .rpc();

      console.log("Initialize game: Transaction sent", signature);

      // Wait to confirm the transaction
      const confirmResult = await connection.confirmTransaction({
        blockhash: latestBlockHash.blockhash,
        lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
        signature,
      });

      if (confirmResult) {
        console.log("Initialize game transaction was confirmed");
      }
    } catch (err) {
      console.error("Initialize game error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button onClick={handleInitGame} disabled={isLoading}>
      {isLoading ? "Loading..." : "Init Game"}
    </Button>
  );
};
