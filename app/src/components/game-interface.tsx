import { useState } from "react";
import { GameHeader } from "./game-header";
import { GameFeed } from "./game-feed";
import { AbilityCards } from "./ability-cards";
import { GameControls } from "./game-controls";
import { InfoModal } from "./info-modal";
import { BuyCiphersModal } from "./buy-ciphers-modal";
import { CostInfoModal } from "./cost-info-modal";
import { StatusArea } from "./status-area";

// Types for our game state
export type CardType = "oracle" | "shield" | "doubler" | "swift" | "dejavu";

export interface GameCard {
  id: string;
  type: CardType;
  name: string;
  description: string;
  icon: string;
}

export interface AbilityCard extends GameCard {}

export default function GameInterface() {
  // Game state
  const [ciphers, setCiphers] = useState(5);
  const [baseCost, setBaseCost] = useState(1);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [buyCiphersModalOpen, setBuyCiphersModalOpen] = useState(false);
  const [costInfoModalOpen, setCostInfoModalOpen] = useState(false);
  const [selectedCards, setSelectedCards] = useState<GameCard[]>([]);
  const [viewedCard, setViewedCard] = useState<GameCard | null>(null);
  const [gameFeed, setGameFeed] = useState<{ message: string; isNew: boolean }[]>([
    { message: "Welcome to Blockrunners!", isNew: false },
    { message: "You've entered the Neon District.", isNew: false },
    { message: "Choose your next move carefully.", isNew: false },
    { message: "A Cyber Sentinel appears ahead.", isNew: false },
  ]);

  // Sample cards for demonstration
  const [playerCards, setPlayerCards] = useState<GameCard[]>([
    {
      id: "1",
      type: "oracle",
      name: "Oracle",
      description: "Reveals the correct path for the next step.",
      icon: "eye",
    },
    {
      id: "2",
      type: "shield",
      name: "Shield",
      description: "Prevents a reset if the next step is incorrect.",
      icon: "shield",
    },
    {
      id: "3",
      type: "doubler",
      name: "Doubler",
      description: "The next correct step awards two random cards instead of one.",
      icon: "copy",
    },
    {
      id: "4",
      type: "swift",
      name: "Swift",
      description: "The next step costs one less cipher.",
      icon: "zap",
    },
    {
      id: "5",
      type: "dejavu",
      name: "Dejavu",
      description: "Teleports the player three steps back.",
      icon: "rewind",
    },
    {
      id: "6",
      type: "oracle",
      name: "Oracle",
      description: "Reveals the correct path for the next step.",
      icon: "eye",
    },
  ]);

  // Calculate the total cost for the next move
  const nextMoveCost = Math.max(1, baseCost + selectedCards.length);

  // Game actions
  const buyMoreCiphers = (amount: number) => {
    setCiphers((prev) => prev + amount);
    setBuyCiphersModalOpen(false);
    addToFeed(`Purchased ${amount} ciphers!`);
  };

  const makeMove = (direction: "left" | "right") => {
    if (ciphers >= nextMoveCost) {
      setCiphers((prev) => prev - nextMoveCost);

      // Apply selected card effects
      const cardEffects = selectedCards.map((card) => `${card.name} activated!`).join(" ");
      const moveMessage = `Moved ${direction}. Spent ${nextMoveCost} ciphers.${
        cardEffects ? ` ${cardEffects}` : ""
      }`;
      addToFeed(moveMessage);

      // Remove used cards from player's hand
      const usedCardIds = selectedCards.map((card) => card.id);
      setPlayerCards((prev) => prev.filter((card) => !usedCardIds.includes(card.id)));

      // Reset selected cards
      setSelectedCards([]);
      setViewedCard(null);

      // Simulate game progression
      setTimeout(() => {
        const randomEvent =
          Math.random() > 0.5 ? "You found a hidden passage!" : "A security drone scans the area.";
        addToFeed(randomEvent);

        // Randomly add a new card
        if (Math.random() > 0.7) {
          const cardTypes: CardType[] = ["oracle", "shield", "doubler", "swift", "dejavu"];
          const randomType = cardTypes[Math.floor(Math.random() * cardTypes.length)];
          const newCard: GameCard = {
            id: `new-${Date.now()}`,
            type: randomType,
            name: randomType.charAt(0).toUpperCase() + randomType.slice(1),
            description: getCardDescription(randomType),
            icon: getCardIcon(randomType),
          };

          setPlayerCards((prev) => [...prev, newCard]);
          addToFeed(`You found a ${newCard.name} card!`);
        }
      }, 1000);
    } else {
      addToFeed("Not enough ciphers for this move!");
    }
  };

  const toggleCardSelection = (card: GameCard) => {
    if (selectedCards.some((c) => c.id === card.id)) {
      setSelectedCards((prev) => prev.filter((c) => c.id !== card.id));
    } else {
      setSelectedCards((prev) => [...prev, card]);
    }
  };

  const viewCard = (card: GameCard) => {
    setViewedCard(card);
  };

  const closeCardDescription = () => {
    setViewedCard(null);
  };

  const addToFeed = (message: string) => {
    setGameFeed((prev) => [
      ...prev.map((item) => ({ ...item, isNew: false })),
      { message, isNew: true },
    ]);

    // After a delay, set isNew to false
    setTimeout(() => {
      setGameFeed((prev) =>
        prev.map((item, index) => (index === prev.length - 1 ? { ...item, isNew: false } : item))
      );
    }, 2000);
  };

  function getCardDescription(type: CardType): string {
    switch (type) {
      case "oracle":
        return "Reveals the correct path for the next step.";
      case "shield":
        return "Prevents a reset if the next step is incorrect.";
      case "doubler":
        return "The next correct step awards two random cards instead of one.";
      case "swift":
        return "The next step costs one less cipher.";
      case "dejavu":
        return "Teleports the player three steps back.";
      default:
        return "";
    }
  }

  function getCardIcon(type: CardType): string {
    switch (type) {
      case "oracle":
        return "eye";
      case "shield":
        return "shield";
      case "doubler":
        return "copy";
      case "swift":
        return "zap";
      case "dejavu":
        return "rewind";
      default:
        return "";
    }
  }

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto w-full">
      <GameHeader
        ciphers={ciphers}
        onInfoClick={() => setInfoModalOpen(true)}
        onBuyCiphersClick={() => setBuyCiphersModalOpen(true)}
      />

      <div className="flex-1 overflow-hidden flex flex-col p-4 gap-3">
        <GameFeed messages={gameFeed} />

        <AbilityCards
          cards={playerCards}
          selectedCards={selectedCards}
          onCardSelect={toggleCardSelection}
          onCardView={viewCard}
        />

        <StatusArea
          card={viewedCard}
          ciphers={ciphers}
          nextMoveCost={nextMoveCost}
          onBuyCiphers={() => setBuyCiphersModalOpen(true)}
          statusMessage={ciphers < nextMoveCost ? undefined : undefined}
        />

        <GameControls
          onMove={makeMove}
          nextMoveCost={nextMoveCost}
          disabled={ciphers < nextMoveCost}
          onCostInfoClick={() => setCostInfoModalOpen(true)}
        />
      </div>

      <InfoModal open={infoModalOpen} onClose={() => setInfoModalOpen(false)} />
      <BuyCiphersModal
        open={buyCiphersModalOpen}
        onClose={() => setBuyCiphersModalOpen(false)}
        onBuy={buyMoreCiphers}
      />
      <CostInfoModal
        open={costInfoModalOpen}
        onClose={() => setCostInfoModalOpen(false)}
        baseCost={baseCost}
        selectedCardsCount={selectedCards.length}
      />
    </div>
  );
}
