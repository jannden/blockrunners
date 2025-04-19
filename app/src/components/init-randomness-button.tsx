import { useCallback, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Button } from "./ui/button";
import { useBlockrunners } from "@/hooks/useBlockrunners";

export const InitRandomnessButton = () => {
  const { publicKey } = useWallet();
  const { gameState, requestRandomness, revealRandomness } = useBlockrunners();

  const [isLoading, setIsLoading] = useState(false);

  const handleRequestRandomness = useCallback(async () => {
    if (!publicKey || !gameState) return;

    setIsLoading(true);
    requestRandomness()
      .catch((error) => {
        console.log("Error requesting randomness:", error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [publicKey, gameState, requestRandomness]);

  const handleRevealRandomness = useCallback(async () => {
    if (!publicKey || !gameState) return;

    setIsLoading(true);
    revealRandomness()
      .catch((error) => {
        console.log("Error revealing randomness:", error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [publicKey, gameState, revealRandomness]);

  return (
    <>
      {gameState && publicKey && (
        <>
          <Button onClick={handleRequestRandomness} disabled={isLoading || !gameState}>
            {isLoading ? "Loading..." : "Request Randomness"}
          </Button>
          <Button onClick={handleRevealRandomness} disabled={isLoading || !gameState}>
            {isLoading ? "Loading..." : "Reveal Randomness"}
          </Button>
        </>
      )}
    </>
  );
};
