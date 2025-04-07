import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { ReactNode, useCallback, useEffect, useState } from "react";
import { BalanceContext } from "../hooks/useBalance";

function BalanceProvider({ children }: { children: ReactNode }) {
  const { connection } = useConnection();
  const { publicKey } = useWallet();

  // Function to refresh the wallet balance
  const [balance, setBalance] = useState<number>(0);
  const refreshBalance = useCallback(async () => {
    if (!publicKey) {
      setBalance(0);
      return;
    }

    try {
      const lamports = await connection.getBalance(publicKey);
      setBalance(lamports / LAMPORTS_PER_SOL);
    } catch (error) {
      console.error("Error fetching balance:", error);
    }
  }, [connection, publicKey]);

  // Refresh balance when connected
  useEffect(() => {
    refreshBalance();
  }, [refreshBalance]);

  return (
    <BalanceContext.Provider value={{ balance, refreshBalance }}>
      {children}
    </BalanceContext.Provider>
  );
}

export default BalanceProvider;
