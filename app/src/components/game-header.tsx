import { Plus, Zap, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WalletButton } from "./wallet/wallet-button";

interface GameHeaderProps {
  ciphers: number;
  prizePool: number;
  onInfoClick: () => void;
  onBuyCiphersClick: () => void;
}

export function GameHeader({
  ciphers,
  prizePool,
  onInfoClick,
  onBuyCiphersClick,
}: GameHeaderProps) {
  return (
    <header className="sticky top-0 z-10 bg-[var(--app-secondary)] text-white p-4 border-b-4 border-black shadow-[0px_4px_0px_0px_rgba(0,0,0,1)] max-w-md mx-auto w-full">
      <div className="flex items-center justify-between">
        <h1
          className="text-2xl font-black tracking-tighter cursor-pointer hover:underline"
          onClick={onInfoClick}
        >
          BLOCKRUNNERS
        </h1>

        <div className="flex items-center space-x-3">
          {/* Wallet Button */}
          <WalletButton />

          {/* Prize Pool */}
          <div className="flex items-center bg-black/30 rounded-md px-2 py-1 border-2 border-black">
            <Trophy className="w-4 h-4 mr-1 text-[var(--app-primary)]" />
            <span className="text-sm font-bold">{prizePool} SOL</span>
          </div>

          {/* Ciphers with Plus Button */}
          <Button
            onClick={onBuyCiphersClick}
            className="group flex items-center bg-black/30 rounded-md px-2 py-1 h-auto border-2 border-black hover:bg-black/40 transition-colors"
          >
            <Zap className="w-4 h-4 mr-1 text-[var(--app-primary)]" />
            <span className="text-sm font-bold mr-1">{ciphers}</span>
            <span className="flex items-center justify-center bg-[var(--app-primary)] text-black rounded-full w-5 h-5 group-hover:scale-110 transition-transform">
              <Plus className="w-3 h-3" />
            </span>
          </Button>
        </div>
      </div>
    </header>
  );
}
