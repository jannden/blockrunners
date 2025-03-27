"use client";

import { Button } from "@/components/ui/button";
import type { GameCard } from "./game-interface";

interface StatusAreaProps {
  card: GameCard | null;
  ciphers: number;
  nextMoveCost: number;
  onBuyCiphers: () => void;
  statusMessage?: string;
}

export function StatusArea({
  card,
  ciphers,
  nextMoveCost,
  onBuyCiphers,
  statusMessage,
}: StatusAreaProps) {
  // Not enough ciphers scenario
  if (ciphers < nextMoveCost) {
    return (
      <div className="flex items-center justify-between text-[var(--app-secondary)]">
        <p className="text-sm font-medium">Not enough ciphers for next move!</p>
        <Button
          size="sm"
          onClick={onBuyCiphers}
          className="bg-[var(--app-primary)] hover:bg-[var(--app-primary)]/90 text-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all text-xs h-8"
        >
          Buy More
        </Button>
      </div>
    );
  }

  // Custom status message
  if (statusMessage) {
    return (
      <div className="text-[var(--app-accent)]">
        <p className="text-sm text-center">{statusMessage}</p>
      </div>
    );
  }

  // Card description
  if (card) {
    return (
      <div className="text-muted-foreground">
        <p className="text-sm text-center">{card.description}</p>
      </div>
    );
  }

  // Default state
  return (
    <div className="text-muted-foreground">
      <p className="text-sm text-center">Make your move.</p>
    </div>
  );
}
