import { useState } from "react";
import { useStore } from "@/lib/game-store";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";

export function DebugOverlay() {
  const { cards, playerPath, playerPosition, giveCards } = useStore();

  const [isOpen, setIsOpen] = useState(false);

  // Group cards by type for debugging display
  const cardsByType = cards.reduce((acc, card) => {
    if (!acc[card.type]) {
      acc[card.type] = [];
    }
    acc[card.type].push(card);
    return acc;
  }, {} as Record<string, typeof cards>);

  const currentPathSegment = playerPath.slice(Math.max(0, playerPosition - 3), playerPosition + 4);

  return (
    <div className="fixed bottom-2 right-2 z-50">
      <Button variant="outline" className="mb-2" onClick={() => setIsOpen((prev) => !prev)}>
        {isOpen ? "Hide Debug" : "Show Debug"}
      </Button>

      {isOpen && (
        <Card className="p-4 w-80 bg-black/90 text-white border-white/20 text-xs">
          <div className="mb-4">
            <h3 className="font-bold mb-1">Card Inventory:</h3>
            <div className="flex flex-wrap gap-1">
              {Object.entries(cardsByType).map(([type, cards]) => (
                <Badge key={type} variant="outline" className="capitalize text-white">
                  {type}: {cards.length}
                </Badge>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <h3 className="font-bold mb-1">Current Path Segment:</h3>
            <div className="flex items-center space-x-1">
              {currentPathSegment.map((dir, idx) => {
                const actualPosition = Math.max(0, playerPosition - 3) + idx;
                const isCurrent = actualPosition === playerPosition;

                return (
                  <Badge
                    key={idx}
                    variant={isCurrent ? "default" : "outline"}
                    className={isCurrent ? "bg-blue-500" : ""}
                  >
                    {isCurrent ? "→" : ""} {dir}
                  </Badge>
                );
              })}
            </div>
            <div className="mt-1">Current position: {playerPosition}</div>
          </div>

          <div>
            <h3 className="font-bold mb-1">Debug Actions:</h3>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" className="text-xs" onClick={() => giveCards(1)}>
                Add Random Card
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
