import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import type { GameCard } from "./game-interface";

interface SelectedCardAreaProps {
  card: GameCard;
  onUse: () => void;
  onClose: () => void;
}

export function SelectedCardArea({ card, onUse, onClose }: SelectedCardAreaProps) {
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

  return (
    <div className="border-4 border-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
      <div className={`${getCardColor(card.type)} p-4 text-white relative`}>
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2 text-white hover:bg-white/20 rounded-full"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </Button>
        <h3 className="font-bold text-xl">{card.name}</h3>
        <p className="mt-2 text-sm">{card.description}</p>
      </div>
      <div className="p-4 bg-white dark:bg-[#1e1e1e]">
        <Button
          onClick={onUse}
          className="w-full bg-[var(--app-secondary)] hover:bg-[var(--app-secondary)]/90 text-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all"
        >
          Use Card
        </Button>
      </div>
    </div>
  );
}
