"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GameControlsProps {
  onMove: (direction: "left" | "right") => void;
  nextMoveCost: number;
  disabled: boolean;
  onCostInfoClick: () => void;
}

export function GameControls({
  onMove,
  nextMoveCost,
  disabled,
  onCostInfoClick,
}: GameControlsProps) {
  return (
    <div className="flex items-center justify-between border-4 border-black rounded-lg p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white dark:bg-[#1e1e1e]">
      <Button
        onClick={() => onMove("left")}
        disabled={disabled}
        className="flex-1 h-16 bg-[var(--app-primary)] hover:bg-[var(--app-primary)]/90 text-black border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
      >
        <ArrowLeft className="h-8 w-8 mr-2" />
        <span className="font-bold text-lg">LEFT</span>
      </Button>

      <Button
        onClick={onCostInfoClick}
        variant="ghost"
        className="group flex flex-col items-center justify-center hover:bg-transparent"
      >
        <div className="text-2xl font-black bg-black text-white h-16 p-2 aspect-square flex items-center justify-center rounded-full border-2 border-[var(--app-secondary)] transform rotate-12 shadow-[2px_2px_0px_0px_rgba(255,90,95,1)] group-hover:scale-110 transition-transform">
          {nextMoveCost}
        </div>
      </Button>

      <Button
        onClick={() => onMove("right")}
        disabled={disabled}
        className="flex-1 h-16 bg-[var(--app-primary)] hover:bg-[var(--app-primary)]/90 text-black border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
      >
        <span className="font-bold text-lg">RIGHT</span>
        <ArrowRight className="h-8 w-8 ml-2" />
      </Button>
    </div>
  );
}
