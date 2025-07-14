"use client";

import { AirdropButton } from "./airdrop-button";
import { useBlockrunners } from "@/hooks/useBlockrunners";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { useBalance } from "@/hooks/useBalance";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useMemo } from "react";
import { InitPlayerButton } from "./init-player-button";
import { JoinGameButton } from "./join-game-button";
import { InitializeGameButton } from "./initialize-game-button";
import { MoveRevealButton } from "./move-reveal-button";
import { MoveCommitButtons } from "./move-commit-buttons";

interface GameControlsProps {
  nextMoveCost: number;
  onCostInfoClick: () => void;
  onPurchaseCiphersClick: () => void;
  progress: number;
}

export function GameControls({
  nextMoveCost,
  onCostInfoClick,
  onPurchaseCiphersClick,
  progress,
}: GameControlsProps) {
  const { connection } = useConnection();
  const { connected } = useWallet();
  const { balance } = useBalance();
  const { gameState, playerState } = useBlockrunners();

  // Check if we're on devnet
  const isDevnet = useMemo(() => {
    const endpoint = connection.rpcEndpoint;
    return endpoint.includes("devnet");
  }, [connection.rpcEndpoint]);

  // Check if balance is under 1 SOL
  const balanceUnderOneSol = useMemo(() => {
    return balance / LAMPORTS_PER_SOL < 1;
  }, [balance]);

  // Button visibility conditions
  const showAirdropButton = connected && isDevnet && balanceUnderOneSol;
  const showInitGameButton = connected && !showAirdropButton && !gameState;
  const showInitPlayerButton =
    connected && !showAirdropButton && !showInitGameButton && gameState && !playerState;

  // Only show join game when player exists, game exists, and player.gameStart doesn't match gameState.start
  const canJoinGame =
    playerState &&
    gameState &&
    (!playerState.gameStart || playerState.gameStart.toString() !== gameState.start.toString());

  const showJoinGameButton =
    connected && !showAirdropButton && !showInitGameButton && !showInitPlayerButton && canJoinGame;

  const showMoveCommitButtons =
    connected &&
    !showAirdropButton &&
    !showInitGameButton &&
    !showInitPlayerButton &&
    !showJoinGameButton &&
    !!playerState &&
    !!playerState.gameStart &&
    playerState.gameStart.toString() === gameState?.start.toString() &&
    !playerState.moveDirection; // TODO: Update to randomnessAccount

  const showMoveRevealButton =
    connected &&
    !showAirdropButton &&
    !showInitGameButton &&
    !showInitPlayerButton &&
    !showJoinGameButton &&
    !showMoveCommitButtons &&
    !!playerState &&
    !!playerState.gameStart &&
    playerState.gameStart.toString() === gameState?.start.toString() &&
    playerState.moveDirection; // TODO: Update to randomnessAccount

  return (
    <div className="border-4 border-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white dark:bg-[#1e1e1e] overflow-hidden">
      <div className="p-4">
        <div className="flex flex-row flex-wrap">
          {showAirdropButton && <AirdropButton />}
          {showInitGameButton && <InitializeGameButton />}
          {showInitPlayerButton && <InitPlayerButton />}
          {showJoinGameButton && <JoinGameButton />}
          {showMoveRevealButton && <MoveRevealButton />}
        </div>

        {showMoveCommitButtons && (
          <MoveCommitButtons
            nextMoveCost={nextMoveCost}
            onCostInfoClick={onCostInfoClick}
            onPurchaseCiphersClick={onPurchaseCiphersClick}
          />
        )}
      </div>

      {/* Progress bar */}
      <div className="relative h-4 bg-black">
        <div
          className="absolute inset-0 bg-[var(--app-primary)] border-t-2 border-black"
          style={{ width: `${progress}%` }}
        >
          <div className="absolute top-0 right-0 h-full w-4 bg-[var(--app-primary)] clip-path-progress-edge"></div>
        </div>
      </div>
    </div>
  );
}
