import { useCallback, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Button } from "./ui/button";
import { useBlockrunners } from "@/hooks/useBlockrunners";

export const InitGameButton = () => {
  const { publicKey } = useWallet();
  const { gameState, initializeGame } = useBlockrunners();

  const [isLoading, setIsLoading] = useState(false);

  const handleInitGame = useCallback(async () => {
    if (!publicKey) return;

    setIsLoading(true);
    initializeGame()
      .catch((error) => {
        console.log("Error initializing game:", error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [publicKey, initializeGame]);

  return (
    <>
      {publicKey && !gameState && (
        <Button onClick={handleInitGame} disabled={isLoading || !!gameState}>
          {isLoading ? "Loading..." : "Init Game"}
        </Button>
      )}
    </>
  );
};
