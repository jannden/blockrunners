import { useCallback, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Button } from "./ui/button";
import { useBlockrunners } from "@/hooks/useBlockrunners";

export const MoveRequestButton = () => {
  const { publicKey } = useWallet();
  const { gameState, playerState, moveRequest } = useBlockrunners();

  const [isLoading, setIsLoading] = useState(false);

  const handleMoveRequest = useCallback(async () => {
    console.log("Move Request button clicked", publicKey, gameState);
    if (!publicKey || !gameState) return;

    setIsLoading(true);
    moveRequest()
      .catch((error) => {
        console.log("Error initializing player:", error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [publicKey, gameState, moveRequest]);

  return (
    <>
      {publicKey && playerState && (
        <Button onClick={handleMoveRequest} disabled={isLoading || !gameState}>
          {isLoading ? "Loading..." : "Commit to Go Right"}
        </Button>
      )}
    </>
  );
};
