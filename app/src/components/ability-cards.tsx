import { Card, CardContent } from "@/components/ui/card";
import { Shield, Copy, Zap } from "lucide-react";
import { AbilityCard } from "@/lib/types";

interface AbilityCardsProps {
  cards: AbilityCard[];
  selectedCards: AbilityCard[];
  onCardSelect: (card: AbilityCard) => void;
  inTheGame: boolean;
  isSelectable?: boolean;
}

export function AbilityCards({
  cards,
  selectedCards,
  onCardSelect,
  inTheGame,
  isSelectable = true,
}: AbilityCardsProps) {
  // Group cards by type to display counts
  const groupedCards = (() => {
    const result = new Map<string, AbilityCard[]>();

    // Group cards by type
    cards.forEach((card) => {
      if (!result.has(card.type)) {
        result.set(card.type, []);
      }
      result.get(card.type)?.push(card);
    });

    // Create a representative card for each group
    return Array.from(result.entries()).map(([type, cardsOfType]) => ({
      type,
      cards: cardsOfType,
      representativeCard: cardsOfType[0],
      count: cardsOfType.length,
    }));
  })();

  const getCardColor = (type: string) => {
    switch (type) {
      case "shield":
        return "bg-[var(--app-card-shield)]";
      case "doubler":
        return "bg-[var(--app-card-doubler)]";
      case "swift":
        return "bg-[var(--app-card-swift)]";
      default:
        return "bg-gray-500";
    }
  };

  const getCardIcon = (iconName: string) => {
    switch (iconName) {
      case "shield":
        return <Shield className="h-6 w-6" />;
      case "copy":
        return <Copy className="h-6 w-6" />;
      case "zap":
        return <Zap className="h-6 w-6" />;
      default:
        return null;
    }
  };

  // Check if any card of the type is selected
  const isCardTypeSelected = (cardsOfType: AbilityCard[]) => {
    if (cardsOfType.length === 0) return false;
    const cardType = cardsOfType[0].type;
    // Check if any card of this type is in the selectedCards array
    return selectedCards.some((sc) => sc.type === cardType);
  };

  // Handle selection or deselection of cards
  const handleCardSelect = (cardsOfType: AbilityCard[]) => {
    if (cardsOfType.length === 0 || !isSelectable) return;

    const cardType = cardsOfType[0].type;
    // Check if any card of this type is already selected
    const isTypeSelected = selectedCards.some((sc) => sc.type === cardType);

    if (isTypeSelected) {
      // If a card of this type is selected, deselect it by passing the first card
      // The context will handle finding the correct card to deselect
      onCardSelect(cardsOfType[0]);
    } else {
      // Otherwise select the first available card of this type
      onCardSelect(cardsOfType[0]);
    }
  };

  return (
    <div className="space-y-2">
      {groupedCards.length === 0 || !inTheGame ? (
        <div className="text-center p-4 border-2 border-dashed border-gray-300 rounded-md">
          <p className="text-gray-500">&nbsp;</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {groupedCards.map(({ type, cards: cardsOfType, representativeCard, count }) => (
            <Card
              key={type}
              className={`${
                isSelectable && "cursor-pointer"
              } border-3 border-black transition-all ${
                isCardTypeSelected(cardsOfType)
                  ? "animate-pulse border-[#ffeb3b] shadow-[0_0_8px_2px_rgba(255,235,59,0.6)]"
                  : isSelectable
                  ? "hover:translate-y-[-4px]"
                  : ""
              } shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-lg`}
              onClick={() => handleCardSelect(cardsOfType)}
            >
              <CardContent
                className={`p-3 ${getCardColor(
                  type
                )} text-white rounded relative h-full flex flex-col`}
              >
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center">
                    <div className="mr-1.5">{getCardIcon(representativeCard.icon)}</div>
                    <h3 className="font-bold leading-tight">{representativeCard.name}</h3>
                  </div>
                  {count > 1 && (
                    <div className="bg-black/70 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                      {count}
                    </div>
                  )}
                </div>

                <p className="text-xs">{representativeCard.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
