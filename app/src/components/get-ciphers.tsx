import { useCallback, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Button } from "./ui/button";
import { useBlockrunners } from "@/hooks/useBlockrunners";

export const GetCiphersButton = () => {
  const { publicKey } = useWallet();
  const { gameState, playerState, purchaseCiphers } = useBlockrunners();

  const [isLoading, setIsLoading] = useState(false);

  const handleGetCiphers = useCallback(async () => {
    console.log("Get Ciphers button clicked", publicKey, gameState);
    if (!publicKey || !gameState) return;

    setIsLoading(true);
    purchaseCiphers(1)
      .catch((error) => {
        console.log("Error initializing player:", error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [publicKey, gameState, purchaseCiphers]);

  return (
    <>
      {publicKey && playerState && (
        <Button onClick={handleGetCiphers} disabled={isLoading || !gameState}>
          {isLoading ? "Loading..." : "Get Ciphers"}
        </Button>
      )}
    </>
  );
};
