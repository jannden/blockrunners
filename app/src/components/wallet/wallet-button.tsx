import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWalletStore } from "@/lib/wallet-store";
import { useEffect } from "react";

export function WalletButton() {
  const { connected } = useWallet();
  const { balance, refreshBalance } = useWalletStore();

  // Refresh balance when connected
  useEffect(() => {
    if (connected) {
      refreshBalance();
    }
  }, [connected, refreshBalance]);

  return (
    <div className="flex items-center space-x-2">
      {connected && (
        <div className="text-sm font-mono bg-black/10 dark:bg-white/10 px-3 py-1 rounded-md">
          {balance.toFixed(4)} SOL
        </div>
      )}
      <WalletMultiButton className="!bg-[var(--app-primary)] hover:!bg-[var(--app-primary)]/90 !text-black !border-2 !border-black !shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:!translate-y-1 hover:!shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] !transition-all !h-10" />
    </div>
  );
}
