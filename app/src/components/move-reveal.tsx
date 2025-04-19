import { useCallback, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Button } from "./ui/button";
import { useBlockrunners } from "@/hooks/useBlockrunners";

export const MoveRevealButton = () => {
  const { publicKey } = useWallet();
  const { gameState, playerState, moveReveal } = useBlockrunners();

  const [isLoading, setIsLoading] = useState(false);

  const handleMoveReveal = useCallback(async () => {
    console.log("Move Reveal button clicked", publicKey, gameState);
    if (!publicKey || !gameState) return;

    setIsLoading(true);
    moveReveal()
      .catch((error) => {
        console.log("Error revealing move result:", error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [publicKey, gameState, moveReveal]);

  return (
    <>
      {publicKey && playerState && (
        <Button onClick={handleMoveReveal} disabled={isLoading || !gameState}>
          {isLoading ? "Loading..." : "Reveal Move Result"}
        </Button>
      )}
    </>
  );
};
