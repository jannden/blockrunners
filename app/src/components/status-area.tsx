"use client";

import { Button } from "@/components/ui/button";

interface StatusAreaProps {
  ciphers: number;
  nextMoveCost: number;
  position: number;
  totalBlocks: number;
  onBuyCiphers: () => void;
  statusMessage?: string;
}

export function StatusArea({
  ciphers,
  nextMoveCost,
  position,
  totalBlocks,
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

  // Default state - show position information
  return (
    <div className="text-muted-foreground text-center">
      <p className="text-sm">
        Position: {position} / {totalBlocks} blocks
      </p>
    </div>
  );
}
