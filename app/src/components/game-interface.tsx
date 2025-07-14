import { useState } from "react";

import { useWallet } from "@solana/wallet-adapter-react";

import { GameHeader } from "./game-header";
import { GameFeed } from "./game-feed";
import { AbilityCards } from "./ability-cards";
import { GameControls } from "./game-controls";
import { InfoModal } from "./info-modal";
import { PurchaseCiphersModal } from "./purchase-ciphers-modal";
import { CostInfoModal } from "./cost-info-modal";
import { AbilityCard } from "@/lib/types";
import { useBlockrunners } from "@/hooks/useBlockrunners";
import { InfoContent } from "./info-content";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { transformBlockchainCards } from "@/lib/utils";
import { INITIAL_PATH_LENGTH } from "@/lib/constants";

export function GameInterface() {
  const { connected } = useWallet();
  const {
    playerState,
    gameState,
    // UI state
    selectedCards,
    // Actions
    selectCard,
    deselectCard,
  } = useBlockrunners();

  // Modal state
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [purchaseCiphersModalOpen, setPurchaseCiphersModalOpen] = useState(false);
  const [costInfoModalOpen, setCostInfoModalOpen] = useState(false);

  // Get the game's prize pool from context
  const gamePrizePool = gameState?.prizePool ? Number(gameState.prizePool) : 0;

  // Determine if the player is in the game
  const inTheGame: boolean =
    connected &&
    !!playerState &&
    !!playerState.gameStart &&
    playerState.gameStart.toString() === gameState?.start.toString();

  // Get the player's cipher count from context - show 0 if not in current game
  const ciphers = inTheGame && playerState?.ciphers ? Number(playerState.ciphers) : 0;

  // Transform player cards from blockchain format to our app format
  const playerCards = transformBlockchainCards(playerState?.cards);

  // Calculate progress
  const playerPosition = playerState?.position ? Number(playerState.position) : 0;
  const pathLength = gameState?.pathLength || INITIAL_PATH_LENGTH;
  const progress = Math.floor((playerPosition / pathLength) * 100);

  // Determine if cards should be selectable (only when player is in the game and not waiting for move reveal)
  const isCardsSelectable = inTheGame && !playerState?.moveDirection; // TODO: Change to randomnessAccount

  // Calculate the total cost for the next move
  // Base cost is 1 + number of selected cards
  let nextMoveCost = 1 + selectedCards.length;

  // Apply Swift card effect if present (reduces cost by 2, but never below 0)
  if (selectedCards.some((card: AbilityCard) => card.type === "swift")) {
    nextMoveCost = Math.max(0, nextMoveCost - 2);
  }

  const handleToggleCardSelection = (card: AbilityCard) => {
    // Don't allow card selection during move reveal state
    if (!isCardsSelectable) return;

    // Check if any card of this type is already selected
    const isTypeSelected = selectedCards.some((sc) => sc.type === card.type);

    if (isTypeSelected) {
      // Find the selected card of this type to deselect
      const selectedCard = selectedCards.find((sc) => sc.type === card.type);
      if (selectedCard) {
        deselectCard(selectedCard.id);
      }
    } else {
      selectCard(card);
    }
  };

  return (
    <div className="flex flex-col overflow-hidden h-screen max-w-md mx-auto w-full">
      <GameHeader
        ciphers={ciphers}
        prizePool={gamePrizePool}
        onInfoClick={() => setInfoModalOpen(true)}
        onPurchaseCiphersClick={() => setPurchaseCiphersModalOpen(true)}
      />

      {!connected && (
        <>
          <div className="my-4">
            <InfoContent />
          </div>
          <WalletMultiButton />
        </>
      )}

      {connected && (
        <>
          <div className="flex-1 flex flex-col py-4 pr-1 gap-4 min-h-0">
            <div className="flex-1 min-h-0">
              <GameFeed />
            </div>

            <div className="flex-shrink-0">
              <AbilityCards
                cards={playerCards}
                selectedCards={selectedCards}
                onCardSelect={handleToggleCardSelection}
                inTheGame={inTheGame}
                isSelectable={isCardsSelectable}
              />
            </div>

            <div className="flex-shrink-0">
              <GameControls
                nextMoveCost={nextMoveCost}
                onCostInfoClick={() => setCostInfoModalOpen(true)}
                onPurchaseCiphersClick={() => setPurchaseCiphersModalOpen(true)}
                progress={progress}
              />
            </div>
          </div>

          <PurchaseCiphersModal
            open={purchaseCiphersModalOpen}
            onClose={() => setPurchaseCiphersModalOpen(false)}
          />
          <CostInfoModal
            open={costInfoModalOpen}
            onClose={() => setCostInfoModalOpen(false)}
            baseCost={1}
            selectedCardsCount={selectedCards.length}
          />
        </>
      )}
      <InfoModal open={infoModalOpen} onClose={() => setInfoModalOpen(false)} />
    </div>
  );
}
