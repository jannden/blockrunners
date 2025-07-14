import { useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Button } from "./ui/button";
import { useProgram } from "@/hooks/useProgram";
import { useBlockrunners } from "@/hooks/useBlockrunners";

export const JoinGameButton = () => {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const [isLoading, setIsLoading] = useState(false);
  const program = useProgram();
  const { setSelectedCards, setSocialFeed } = useBlockrunners();

  const handleJoinGame = async () => {
    if (!publicKey || !program) return;

    setIsLoading(true);
    setSelectedCards([]);
    setSocialFeed([]);

    try {
      const latestBlockHash = await connection.getLatestBlockhash();

      const signature = await program.methods
        .joinGame()
        .accounts({
          player: publicKey,
        })
        .rpc();

      console.log("Join game: Transaction sent", signature);

      // Wait to confirm the transaction
      const confirmResult = await connection.confirmTransaction({
        blockhash: latestBlockHash.blockhash,
        lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
        signature,
      });

      if (confirmResult) {
        console.log("Join game transaction was confirmed");
      }
    } catch (err) {
      console.error("Join game error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button onClick={handleJoinGame} disabled={isLoading} variant="primary">
      {isLoading ? "Loading..." : "Join New Game"}
    </Button>
  );
};
