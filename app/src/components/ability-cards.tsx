import { Card, CardContent } from "@/components/ui/card";
import { Shield, Copy, Zap } from "lucide-react";
import { AbilityCard } from "@/types/game";

interface AbilityCardsProps {
  cards: AbilityCard[];
  selectedCards: AbilityCard[];
  onCardSelect: (card: AbilityCard) => void;
}

export function AbilityCards({ cards, selectedCards, onCardSelect }: AbilityCardsProps) {
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
    return cardsOfType.some((card) => selectedCards.some((sc) => sc.id === card.id));
  };

  // Handle selection or deselection of cards
  const handleCardSelect = (cardsOfType: AbilityCard[]) => {
    // Check if any card of this type is already selected
    const selectedCard = cardsOfType.find((card) => selectedCards.some((sc) => sc.id === card.id));

    if (selectedCard) {
      // If a card of this type is selected, deselect it
      onCardSelect(selectedCard);
    } else {
      // Otherwise select the first available card of this type
      const nonSelectedCard = cardsOfType[0];
      if (nonSelectedCard) {
        onCardSelect(nonSelectedCard);
      }
    }
  };

  return (
    <div className="space-y-2">
      {groupedCards.length === 0 ? (
        <div className="text-center p-4 border-2 border-dashed border-gray-300 rounded-md">
          <p className="text-gray-500">No ability cards available</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {groupedCards.map(({ type, cards: cardsOfType, representativeCard, count }) => (
            <Card
              key={type}
              className={`cursor-pointer border-3 border-black transition-all ${
                isCardTypeSelected(cardsOfType)
                  ? "animate-pulse border-[#ffeb3b] shadow-[0_0_8px_2px_rgba(255,235,59,0.6)]"
                  : "hover:translate-y-[-4px]"
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
