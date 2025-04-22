"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RoundButton } from "./ui/round-button";
import { AirdropButton } from "./airdrop-button";
import { InitGameButton } from "./init-game-button";
import { InitPlayerButton } from "./init-player-button";
import { MoveRequestButton } from "./move-request";
import { MoveRevealButton } from "./move-reveal";
import { useBlockrunners } from "@/hooks/useBlockrunners";
import { useWallet } from "@solana/wallet-adapter-react";
import { GetCiphersButton } from "./get-ciphers";
import { JoinGameButton } from "./join-game-button";

interface GameControlsProps {
  onMove: (direction: "left" | "right") => void;
  nextMoveCost: number;
  disabled: boolean;
  onCostInfoClick: () => void;
  progress: number;
}

export function GameControls({
  onMove,
  nextMoveCost,
  disabled,
  onCostInfoClick,
  progress,
}: GameControlsProps) {
  const { connected } = useWallet();
  const { playerState } = useBlockrunners();

  return (
    <div className="border-4 border-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white dark:bg-[#1e1e1e] overflow-hidden">
      <div className="flex flex-row flex-wrap justify-center gap-2 p-4">
        {connected && <AirdropButton />}
        {connected && <InitGameButton />}
        {connected && <InitPlayerButton />}
        {connected && <JoinGameButton />}
        {connected && <MoveRequestButton />}
        {connected && <MoveRevealButton />}
        {connected && <GetCiphersButton />}
      </div>

      {playerState && (
        <>
          {/* Game controls */}
          <div className="flex items-center justify-between p-4">
            <Button onClick={() => onMove("left")} disabled={disabled} variant="primary">
              <ArrowLeft className="h-8 w-8 mr-2" />
              <span className="font-bold text-lg">LEFT</span>
            </Button>

            <RoundButton onClick={onCostInfoClick}>{nextMoveCost}</RoundButton>

            <Button onClick={() => onMove("right")} disabled={disabled} variant="primary">
              <span className="font-bold text-lg">RIGHT</span>
              <ArrowRight className="h-8 w-8 ml-2" />
            </Button>
          </div>
        </>
      )}

      {/* Progress bar */}
      <div className="relative h-4 bg-black">
        <div
          className="absolute inset-0 bg-[var(--app-primary)] border-t-2 border-black"
          style={{ width: `${progress}%` }}
        >
          <div className="absolute top-0 right-0 h-full w-4 bg-[var(--app-primary)] clip-path-progress-edge"></div>

          {/* Diagonal stripes overlay */}
          <div className="absolute inset-0 bg-stripes opacity-20"></div>
        </div>

        {/* Level markers */}
        <div className="absolute inset-y-0 left-0 right-0">
          <div className="absolute left-1/4 top-0 bottom-0 w-0.5 bg-black/20"></div>
          <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-black/20"></div>
          <div className="absolute left-3/4 top-0 bottom-0 w-0.5 bg-black/20"></div>
        </div>

        {/* Glitch scanline effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-transparent opacity-30 pointer-events-none scanline-animation"></div>
      </div>
    </div>
  );
}
