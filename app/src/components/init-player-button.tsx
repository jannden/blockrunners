import { useCallback, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Button } from "./ui/button";
import { useBlockrunners } from "@/hooks/useBlockrunners";

export const InitPlayerButton = () => {
  const { publicKey } = useWallet();
  const { gameState, initializePlayer, playerState } = useBlockrunners();

  const [isLoading, setIsLoading] = useState(false);

  const handleInitPlayer = useCallback(async () => {
    if (!publicKey || !gameState) return;

    setIsLoading(true);
    initializePlayer()
      .catch((error) => {
        console.log("Error initializing player:", error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [publicKey, gameState, initializePlayer]);

  return (
    <>
      {gameState && publicKey && !playerState && (
        <Button onClick={handleInitPlayer} disabled={isLoading}>
          {isLoading ? "Loading..." : "Init Player"}
        </Button>
      )}
    </>
  );
};
