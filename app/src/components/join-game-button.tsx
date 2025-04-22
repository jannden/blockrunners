import { useCallback, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Button } from "./ui/button";
import { useBlockrunners } from "@/hooks/useBlockrunners";

export const JoinGameButton = () => {
  const { publicKey } = useWallet();
  const { gameState, playerState, joinGame } = useBlockrunners();

  const [isLoading, setIsLoading] = useState(false);

  const handleJoinGame = useCallback(async () => {
    console.log("Join Game button clicked", publicKey, gameState);
    if (!publicKey || !gameState) return;

    setIsLoading(true);
    joinGame()
      .catch((error) => {
        console.log("Error joining game:", error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [publicKey, gameState, joinGame]);

  const canJoinGame = playerState && !playerState.gameStart;

  return (
    <>
      {publicKey && playerState && canJoinGame && (
        <Button onClick={handleJoinGame} disabled={isLoading || !gameState} variant="primary">
          {isLoading ? "Loading..." : "Join Game"}
        </Button>
      )}
    </>
  );
};
