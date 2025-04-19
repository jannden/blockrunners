import { useCallback, useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Button } from "./ui/button";
import { useBlockrunners } from "@/hooks/useBlockrunners";

export const InitPlayerButton = () => {
  const { publicKey } = useWallet();
  const { gameState, initializePlayer, playerState, isProcessing, program } =
    useBlockrunners();

  const [isLoading, setIsLoading] = useState(false);
  const [isInitEnabled, setIsInitEnabled] = useState(false);

  // 더 자세한 디버깅 정보 추가
  useEffect(() => {
    // 로그 최소화하여 무한 루프 방지
    console.log("===== Init Player Button State =====");

    // 각 조건을 개별적으로 검사
    const hasProgram = !!program;
    const hasGameState = !!gameState;
    const hasPublicKey = !!publicKey;
    const hasNoPlayerState = !playerState;
    const notProcessing = !isProcessing;

    // 모든 조건이 만족되어야 버튼 활성화
    const shouldEnable =
      hasProgram &&
      hasGameState &&
      hasPublicKey &&
      hasNoPlayerState &&
      notProcessing;

    // 값이 변경된 경우에만 상태 업데이트
    if (shouldEnable !== isInitEnabled) {
      console.log("Init Player 버튼 상태 변경:", shouldEnable);
      setIsInitEnabled(shouldEnable);
    }
  }, [program, gameState, playerState, publicKey, isProcessing]); // isInitEnabled 제거

  const handleInitPlayer = useCallback(async () => {
    if (!publicKey || !gameState) {
      console.log("Cannot initialize player: missing publicKey or gameState");
      return;
    }

    setIsLoading(true);
    try {
      console.log("Initializing player...");
      await initializePlayer();
      console.log("Player initialized successfully");
    } catch (error) {
      console.error("Error initializing player:", error);
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, gameState, initializePlayer]);

  // 버튼 상태를 더 명확하게 표시
  const buttonText = () => {
    if (isLoading) return "Loading...";
    if (isProcessing) return "Processing...";
    if (!program) return "No Program";
    if (!gameState) return "Init Game First";
    if (playerState) return "Already Initialized";
    return "Init Player";
  };

  return (
    <Button
      onClick={handleInitPlayer}
      disabled={!isInitEnabled || isLoading || isProcessing}
      className={isInitEnabled ? "bg-green-500 hover:bg-green-600" : ""}
    >
      {buttonText()}
    </Button>
  );
};
