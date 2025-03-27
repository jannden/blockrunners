import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, Shield, Copy, Zap, Rewind } from "lucide-react";
import type { GameCard } from "./game-interface";

interface AbilityCardsProps {
  cards: GameCard[];
  selectedCards: GameCard[];
  onCardSelect: (card: GameCard) => void;
  onCardView: (card: GameCard) => void;
}

export function AbilityCards({
  cards,
  selectedCards,
  onCardSelect,
  onCardView,
}: AbilityCardsProps) {
  const getCardColor = (type: string) => {
    switch (type) {
      case "oracle":
        return "bg-[var(--app-card-oracle)]";
      case "shield":
        return "bg-[var(--app-card-shield)]";
      case "doubler":
        return "bg-[var(--app-card-doubler)]";
      case "swift":
        return "bg-[var(--app-card-swift)]";
      case "dejavu":
        return "bg-[var(--app-card-dejavu)]";
      default:
        return "bg-gray-500";
    }
  };

  const getCardIcon = (iconName: string) => {
    switch (iconName) {
      case "eye":
        return <Eye className="h-8 w-8" />;
      case "shield":
        return <Shield className="h-8 w-8" />;
      case "copy":
        return <Copy className="h-8 w-8" />;
      case "zap":
        return <Zap className="h-8 w-8" />;
      case "rewind":
        return <Rewind className="h-8 w-8" />;
      default:
        return null;
    }
  };

  const isCardSelected = (cardId: string) => {
    return selectedCards.some((card) => card.id === cardId);
  };

  return (
    <div className="space-y-2">
      {cards.length === 0 ? (
        <div className="text-center p-4 border-2 border-dashed border-gray-300 rounded-md">
          <p className="text-gray-500">No ability cards available</p>
        </div>
      ) : (
        <ScrollArea className="w-full whitespace-nowrap pb-1">
          <div className="flex space-x-4 p-1">
            {cards.map((card) => (
              <Card
                key={card.id}
                className={`w-24 shrink-0 cursor-pointer border-3 border-black transition-all ${
                  isCardSelected(card.id)
                    ? "animate-pulse border-[#ffeb3b] shadow-[0_0_8px_2px_rgba(255,235,59,0.6)]"
                    : "hover:translate-y-[-4px]"
                } shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-lg`}
                onClick={() => {
                  onCardSelect(card);
                  onCardView(card);
                }}
              >
                <CardContent className={`p-3 ${getCardColor(card.type)} text-white rounded`}>
                  <div className="flex flex-col items-center">
                    <div className="mb-2">{getCardIcon(card.icon)}</div>
                    <h3 className="font-bold text-sm text-center leading-tight">{card.name}</h3>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <ScrollBar orientation="horizontal" className="mt-2" />
        </ScrollArea>
      )}
    </div>
  );
}
