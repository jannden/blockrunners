import { useCallback, useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Button } from "./ui/button";
import { useBlockrunners } from "@/hooks/useBlockrunners";

export const InitGameButton = () => {
  const { publicKey } = useWallet();
  const { gameState, initializeGame, program, isProcessing } =
    useBlockrunners();

  const [isLoading, setIsLoading] = useState(false);
  const [buttonEnabled, setButtonEnabled] = useState(false);

  // Check if program is initialized - gameState 의존성 추가하여 상태 변화 감지
  useEffect(() => {
    // 무한 루프 방지를 위해 로그 최소화

    // gameState가 있으면 버튼 비활성화
    const shouldEnable = !!program && !gameState && !!publicKey;

    // 값이 변경된 경우에만 상태 업데이트
    if (shouldEnable !== buttonEnabled) {
      console.log("Init Game 버튼 상태 변경:", shouldEnable);
      setButtonEnabled(shouldEnable);
    }
  }, [program, gameState, publicKey, buttonEnabled]);

  const handleInitGame = useCallback(async () => {
    if (!publicKey || !program) {
      console.log(
        "Cannot initialize game: missing publicKey or program not ready"
      );
      return;
    }

    console.log("Attempting to initialize game...");
    setIsLoading(true);

    try {
      await initializeGame();
      console.log("Game initialization completed");
    } catch (error) {
      console.log("Error initializing game:", error);
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, program, initializeGame]);

  // 버튼 상태를 더 명확하게 표시
  const buttonText = () => {
    if (isLoading) return "Loading...";
    if (isProcessing) return "Processing...";
    if (!program) return "No Program";
    if (gameState) return "Already Initialized";
    return "Init Game";
  };

  return (
    <>
      {publicKey && (
        <Button
          onClick={handleInitGame}
          disabled={isLoading || !buttonEnabled || isProcessing}
          className="bg-blue-500 hover:bg-blue-600"
        >
          {buttonText()}
        </Button>
      )}
    </>
  );
};
