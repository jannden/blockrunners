import { Zap, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";
import { useState } from "react";
import { PrizePoolModal } from "./prize-pool-modal";
import { lamportsShortString } from "@/lib/utils";
import { useBlockrunners } from "@/hooks/useBlockrunners";

interface GameHeaderProps {
  ciphers: number;
  prizePool: number;
  onInfoClick: () => void;
  onPurchaseCiphersClick: () => void;
}

export function GameHeader({ ciphers, prizePool, onInfoClick, onPurchaseCiphersClick }: GameHeaderProps) {
  const { connected } = useWallet();
  const [prizePoolModalOpen, setPrizePoolModalOpen] = useState(false);
  const { gameState, playerState } = useBlockrunners();

  // Determine if the player is in the game
  const inTheGame: boolean =
    connected &&
    !!playerState &&
    !!playerState.gameStart &&
    playerState.gameStart.toString() === gameState?.start.toString();

  const onGamePrizePoolClick = () => {
    setPrizePoolModalOpen(true);
  };

  return (
    <header className="sticky top-0 z-10 bg-[var(--app-secondary)] text-white p-4 pt-2 border-b-4 border-black shadow-[0px_4px_0px_0px_rgba(0,0,0,1)] max-w-md mx-auto w-full">
      <h1
        className="flex-1 text-2xl mb-2 text-center font-black tracking-tighter cursor-pointer hover:scale-105 transition-transform"
        onClick={onInfoClick}
      >
        BLOCKRUNNERS
      </h1>
      <div className="flex items-center justify-between">
        <div className="flex-1 text-left">
          <Button
            onClick={onGamePrizePoolClick}
            className="group flex items-center flex-1"
            variant="primary"
            size="sm"
          >
            <Trophy className="w-4 h-4 mr-0.5" />
            <span className="text-sm font-bold">{lamportsShortString(prizePool)}</span>
          </Button>
        </div>
        {connected && gameState && playerState && inTheGame && (
          <div className="flex-1 flex items-center justify-center">
            <Button
              onClick={onPurchaseCiphersClick}
              className="group flex items-center"
              variant="primary"
              size="sm"
            >
              <Zap className="w-4 h-4 ml-2 mr-0.5" />
              <span className="text-sm font-bold">{ciphers}</span>
            </Button>
          </div>
        )}
        <div className="flex-1 text-right">
          <WalletMultiButton />
        </div>
      </div>

      <PrizePoolModal
        open={prizePoolModalOpen}
        onClose={() => setPrizePoolModalOpen(false)}
        prizePool={prizePool}
      />
    </header>
  );
}
