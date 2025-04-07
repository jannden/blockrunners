import { useEffect, useState } from "react";

import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";
import { useBlockrunners } from "@/hooks/useBlockrunners";

import { InitGameButton } from "./init-game-button";
import { InitPlayerButton } from "./init-player-button";
import { AirdropButton } from "./airdrop-button";

import { GameHeader } from "./game-header";
import { GameFeed } from "./game-feed";
import { AbilityCards } from "./ability-cards";
import { GameControls } from "./game-controls";
import { InfoModal } from "./info-modal";
import { BuyCiphersModal } from "./buy-ciphers-modal";
import { CostInfoModal } from "./cost-info-modal";
import { useStore } from "@/lib/game-store";
import { AbilityCard } from "@/types/game";
import { DebugOverlay } from "./debug-overlay";

export function GameInterface() {
  const { connected } = useWallet();
  const { playerState } = useBlockrunners();

  // State from store
  const {
    ciphers,
    cards,
    playerPosition,
    pathLength,
    prizePool,
    socialFeed,
    selectedCards,
    initializeGame,
    makeMove,
    buyCiphers,
    selectCard,
    deselectCard,
  } = useStore();

  // Modal state
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [buyCiphersModalOpen, setBuyCiphersModalOpen] = useState(false);
  const [costInfoModalOpen, setCostInfoModalOpen] = useState(false);

  // Initialize game
  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  // Calculate progress
  const progress = Math.floor((playerPosition / pathLength) * 100);

  // Calculate the total cost for the next move
  // Base cost is 1 + number of selected cards
  let nextMoveCost = 1 + selectedCards.length;

  // Apply Swift card effect if present (reduces cost by 2, but never below 0)
  if (selectedCards.some((card: AbilityCard) => card.type === "swift")) {
    nextMoveCost = Math.max(0, nextMoveCost - 2);
  }

  // Game actions
  const handleBuyMoreCiphers = (amount: number) => {
    buyCiphers(amount);
    setBuyCiphersModalOpen(false);
  };

  const handleMakeMove = (direction: "left" | "right") => {
    makeMove(direction);
  };

  const handleToggleCardSelection = (card: AbilityCard) => {
    if (selectedCards.some((c) => c.id === card.id)) {
      deselectCard(card.id);
    } else {
      selectCard(card);
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto w-full">
      <GameHeader
        ciphers={ciphers}
        prizePool={prizePool}
        onInfoClick={() => setInfoModalOpen(true)}
        onBuyCiphersClick={() => setBuyCiphersModalOpen(true)}
      />

      <div className="flex-1 overflow-hidden flex flex-col py-4 pr-1 gap-4">
        <GameFeed messages={socialFeed} />

        <div className="flex flex-col justify-center">
          <AbilityCards
            cards={cards}
            selectedCards={selectedCards}
            onCardSelect={handleToggleCardSelection}
          />
        </div>

        <div className="flex flex-row justify-center gap-2">
          <WalletMultiButton />
          {connected && <AirdropButton />}
          {connected && <InitGameButton />}
          {connected && <InitPlayerButton />}
        </div>

        {connected && playerState && (
          <GameControls
            onMove={handleMakeMove}
            nextMoveCost={nextMoveCost}
            disabled={ciphers < nextMoveCost}
            onCostInfoClick={() => setCostInfoModalOpen(true)}
            progress={progress}
          />
        )}
      </div>

      <InfoModal open={infoModalOpen} onClose={() => setInfoModalOpen(false)} />
      <BuyCiphersModal
        open={buyCiphersModalOpen}
        onClose={() => setBuyCiphersModalOpen(false)}
        onBuy={handleBuyMoreCiphers}
      />
      <CostInfoModal
        open={costInfoModalOpen}
        onClose={() => setCostInfoModalOpen(false)}
        baseCost={1}
        selectedCardsCount={selectedCards.length}
      />

      <DebugOverlay />
    </div>
  );
}
