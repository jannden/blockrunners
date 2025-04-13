import { useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Button } from "./ui/button";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

export const AirdropButton = () => {
  const { publicKey } = useWallet();
  const { connection } = useConnection();

  const [isLoading, setIsLoading] = useState(false);
  const [balance, setBalance] = useState<number>(0);

  const refreshBalance = async () => {
    if (!publicKey) return;
    const newBalance = await connection.getBalance(publicKey);
    setBalance(newBalance / LAMPORTS_PER_SOL);
  };

  useEffect(() => {
    if (!publicKey) return;
    refreshBalance();
    const interval = setInterval(async () => {
      await refreshBalance();
    }, 10000);

    return () => {
      clearInterval(interval);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publicKey]);

  const handleAirdrop = async () => {
    if (!publicKey) return;

    setIsLoading(true);

    try {
      const [latestBlockhash, signature] = await Promise.all([
        connection.getLatestBlockhash(),
        connection.requestAirdrop(publicKey, 1 * LAMPORTS_PER_SOL),
      ]);
      const sigResult = await connection.confirmTransaction(
        { signature, ...latestBlockhash },
        "confirmed"
      );
      if (sigResult) {
        console.log("Airdrop was confirmed.");
        await refreshBalance();
      }
    } catch (err) {
      console.error("Airdrop error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {publicKey && (
        <Button onClick={handleAirdrop} disabled={isLoading}>
          {isLoading ? "Loading..." : `Airdrop (now ${balance.toFixed(1)} SOL)`}
        </Button>
      )}
    </>
  );
};
