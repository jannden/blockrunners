import { useState, useEffect, ReactNode, useCallback } from "react";
import { useConnection, useAnchorWallet } from "@solana/wallet-adapter-react";
import { BN, Program, Idl } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { gameStatePDA, getPlayerStatePDA } from "../lib/constants";
import type { Direction, GameState, PlayerState } from "../types/types";
import { BlockrunnersContext } from "../hooks/useBlockrunners";
import { useProgram } from "@/hooks/useProgram";
import { SystemProgram } from "@solana/web3.js";

// 타입 오류를 처리하기 위한 헬퍼 함수
function safeDecodeGameState(
  program: Program<Idl>,
  data: Buffer
): GameState | null {
  try {
    // GameState 또는 game_state 둘 다 시도
    try {
      return program.coder.accounts.decode(
        "GameState",
        data
      ) as unknown as GameState;
    } catch {
      console.log("Trying alternative account name for GameState");
      return program.coder.accounts.decode(
        "game_state",
        data
      ) as unknown as GameState;
    }
  } catch (error) {
    console.error("Error decoding GameState:", error);
    return null;
  }
}

function safeDecodePlayerState(
  program: Program<Idl>,
  data: Buffer
): PlayerState | null {
  try {
    // PlayerState 또는 player_state 둘 다 시도
    try {
      return program.coder.accounts.decode(
        "PlayerState",
        data
      ) as unknown as PlayerState;
    } catch {
      console.log("Trying alternative account name for PlayerState");
      return program.coder.accounts.decode(
        "player_state",
        data
      ) as unknown as PlayerState;
    }
  } catch (error) {
    console.error("Error decoding PlayerState:", error);
    return null;
  }
}

function BlockrunnersProvider({ children }: { children: ReactNode }) {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [playerState, setPlayerState] = useState<PlayerState | null>(null);
  const [playerStatePDA, setPlayerStatePDA] = useState<PublicKey | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const program = useProgram();

  // Debug program state - 한 번만 실행되도록 수정
  useEffect(() => {
    console.log("BlockrunnersProvider - Program initialized:", !!program);
    console.log("BlockrunnersProvider - Wallet connected:", !!wallet);
    if (program) {
      console.log("Available methods:", Object.keys(program.methods));
    }
  }, [program, wallet]);

  // PlayerStatePDA 계산 - 별도 useEffect로 분리
  useEffect(() => {
    if (!wallet?.publicKey) {
      setPlayerStatePDA(null);
      return;
    }

    const pda = getPlayerStatePDA(wallet.publicKey);
    setPlayerStatePDA(pda);
  }, [wallet?.publicKey]);

  // Get GameState on load - 별도의 useEffect로 분리
  useEffect(() => {
    if (!program || !connection) return;

    // 초기 GameState 가져오기
    const fetchGameState = async () => {
      try {
        console.log("Fetching GameState from PDA:", gameStatePDA.toString());
        const data = await program.account.gameState.fetchNullable(
          gameStatePDA
        );
        if (data) {
          // 상태가 변경된 경우에만 업데이트하여 무한 루프 방지
          console.log("GameState data detected");
          setGameState((prev) => {
            // 이전 상태와 같으면 업데이트 하지 않음
            if (prev && JSON.stringify(prev) === JSON.stringify(data)) {
              return prev;
            }
            return data as unknown as GameState;
          });
        } else {
          console.log("GameState does not exist yet - may need initialization");
          setGameState(null);
        }
      } catch (error) {
        console.error("GameState fetch error", error);
        setGameState(null);
      }
    };

    fetchGameState();

    // Set up subscription to GameState PDA
    const gameSubscriptionId = connection.onAccountChange(
      gameStatePDA,
      (accountInfo) => {
        if (!program) return;
        console.log("GameState change detected");
        const decoded = safeDecodeGameState(program, accountInfo.data);
        if (decoded) {
          console.log("New GameState detected");
          setGameState((prev) => {
            // 이전 상태와 같으면 업데이트 하지 않음
            if (prev && JSON.stringify(prev) === JSON.stringify(decoded)) {
              return prev;
            }
            return decoded;
          });
        }
      }
    );

    // Set up subscription to SocialFeed PDA
    const emitLogSubscriptionId = program.addEventListener(
      "socialFeedEvent", // TODO: Any other events?
      (event) => {
        // TODO: Add this to state
        console.log("Event Data:", event);
      }
    );

    return () => {
      connection.removeAccountChangeListener(gameSubscriptionId);
      program.removeEventListener(emitLogSubscriptionId);
    };
  }, [connection, program]);

  // Get PlayerState upon public key change
  useEffect(() => {
    if (!program || !connection || !playerStatePDA) {
      setPlayerState(null);
      return;
    }

    // 초기 PlayerState 가져오기
    const fetchPlayerState = async () => {
      try {
        console.log(
          "Fetching PlayerState from PDA:",
          playerStatePDA.toString()
        );
        const data = await program.account.playerState.fetchNullable(
          playerStatePDA
        );
        if (data) {
          // 상태가 변경된 경우에만 업데이트하여 무한 루프 방지
          console.log("PlayerState data detected");
          setPlayerState((prev) => {
            // 이전 상태와 같으면 업데이트 하지 않음
            if (prev && JSON.stringify(prev) === JSON.stringify(data)) {
              return prev;
            }
            return data as unknown as PlayerState;
          });
        } else {
          console.log(
            "PlayerState does not exist yet - may need initialization"
          );
          setPlayerState(null);
        }
      } catch (error) {
        console.error("PlayerState fetch error", error);
        setPlayerState(null);
      }
    };

    fetchPlayerState();

    // Set up subscription to PlayerState PDA
    const playerSubscriptionId = connection.onAccountChange(
      playerStatePDA,
      (accountInfo) => {
        if (!program) return;
        console.log("PlayerState change detected");
        const decoded = safeDecodePlayerState(program, accountInfo.data);
        if (decoded) {
          console.log("New PlayerState detected");
          setPlayerState((prev) => {
            // 이전 상태와 같으면 업데이트 하지 않음
            if (prev && JSON.stringify(prev) === JSON.stringify(decoded)) {
              return prev;
            }
            return decoded;
          });
        }
      }
    );

    // Cleanup subscriptions
    return () => {
      connection.removeAccountChangeListener(playerSubscriptionId);
    };
  }, [connection, playerStatePDA, program]);

  // Instruction 함수들을 useCallback으로 래핑하여 안정적인 참조 유지
  const initializeGame = useCallback(async () => {
    if (!program) {
      console.error("Initialize game: Program not initialized", program);
      console.log("Provider state:", wallet);
      console.log("Connection state:", connection);
      return;
    }

    if (isProcessing) {
      console.log("Transaction is already in progress");
      return;
    }

    console.log("Program is available, proceeding with initialization");

    if (gameState) {
      console.error("Initialize game: GameState already exists");
      return;
    }

    if (!wallet?.publicKey) {
      console.error("Initialize game: Wallet not found");
      return;
    }

    try {
      setIsProcessing(true);

      console.log(
        "Initializing game with wallet:",
        wallet.publicKey.toString()
      );

      // 명시적인 오류 처리와 로깅 추가
      console.log("Using GameState PDA:", gameStatePDA.toString());
      console.log("Available methods:", Object.keys(program.methods));

      // 초기화 트랜잭션에 타임아웃 추가 (30초로 증가)
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error("Transaction timeout after 30 seconds")),
          30000
        )
      );

      // 트랜잭션 실행 또는 타임아웃 중 먼저 발생하는 것을 처리
      const tx = await Promise.race([
        program.methods
          .initializeGame()
          .accounts({
            admin: wallet.publicKey,
            game_state: gameStatePDA,
            system_program: SystemProgram.programId,
          })
          .rpc({ skipPreflight: true }),
        timeoutPromise,
      ]);

      console.log("Initialize game: Transaction sent", tx);

      // 네트워크 종류 확인
      const isLocalnet =
        connection.rpcEndpoint.includes("localhost") ||
        connection.rpcEndpoint.includes("127.0.0.1");

      if (isLocalnet) {
        console.log("🖥️ Local Transaction:", tx);
        console.log("💡 To view details, run: solana confirm -v", tx);
        console.log("💡 Or get logs with: solana logs", tx);
      } else {
        // Solscan 링크 생성
        const networkParam = connection.rpcEndpoint.includes("devnet")
          ? "?cluster=devnet"
          : connection.rpcEndpoint.includes("testnet")
          ? "?cluster=testnet"
          : "";
        const solscanLink = `https://solscan.io/tx/${tx}${networkParam}`;
        console.log("🔍 View transaction on Solscan:", solscanLink);
      }

      // 트랜잭션 완료 후 GameState를 즉시 다시 가져옵니다.
      try {
        console.log("Transaction after GameState manually fetching...");
        // 트랜잭션이 처리될 때까지 짧게 기다립니다.
        await new Promise((resolve) => setTimeout(resolve, 2000));

        const gameData = await program.account.gameState.fetchNullable(
          gameStatePDA
        );
        if (gameData) {
          console.log("New GameState data detected");
          // 상태가 변경된 경우에만 업데이트
          setGameState((prev) => {
            if (prev && JSON.stringify(prev) === JSON.stringify(gameData)) {
              return prev;
            }
            return gameData as unknown as GameState;
          });
        } else {
          console.warn("GameState has not been created yet");
        }
      } catch (fetchErr) {
        console.error("Error fetching GameState:", fetchErr);
      }
    } catch (err: unknown) {
      console.error("Initialize game error:", err);
      if (err && typeof err === "object") {
        if ("message" in err) {
          console.error("Error message:", (err as { message: string }).message);
        }
        if ("stack" in err) {
          console.error("Error stack:", (err as { stack: string }).stack);
        }
        if ("logs" in err) {
          console.error("Transaction logs:", (err as { logs: string[] }).logs);
        }
      }
    } finally {
      setIsProcessing(false);
    }
  }, [program, wallet, gameState, connection, isProcessing]);

  // Instruction: Initialize player
  const initializePlayer = useCallback(async () => {
    if (!program) {
      console.error("Initialize player: Program not initialized");
      return;
    }

    if (isProcessing) {
      console.log("Transaction is already in progress");
      return;
    }

    console.log("Initialize player: Wallet", wallet?.publicKey?.toString());
    console.log(
      "Initialize player: PlayerStatePDA",
      playerStatePDA?.toString()
    );
    if (!wallet?.publicKey || !playerStatePDA) {
      console.error("Initialize player: Wallet or PlayerStatePDA not found");
      return;
    }

    try {
      setIsProcessing(true);
      console.log("Available methods:", Object.keys(program.methods));

      // 초기화 트랜잭션에 타임아웃 추가 (30초로 증가)
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error("Transaction timeout after 30 seconds")),
          30000
        )
      );

      // 트랜잭션 실행 또는 타임아웃 중 먼저 발생하는 것을 처리
      const tx = await Promise.race([
        program.methods
          .initializePlayer()
          .accounts({
            player: wallet.publicKey,
            player_state: playerStatePDA,
            system_program: SystemProgram.programId,
          })
          .rpc({ skipPreflight: true }),
        timeoutPromise,
      ]);

      console.log("Initialize player: Transaction sent", tx);

      // 네트워크 종류 확인
      const isLocalnet =
        connection.rpcEndpoint.includes("localhost") ||
        connection.rpcEndpoint.includes("127.0.0.1");

      if (isLocalnet) {
        console.log("🖥️ Local Transaction:", tx);
        console.log("💡 To view details, run: solana confirm -v", tx);
        console.log("💡 Or get logs with: solana logs", tx);
      } else {
        // Solscan 링크 생성
        const networkParam = connection.rpcEndpoint.includes("devnet")
          ? "?cluster=devnet"
          : connection.rpcEndpoint.includes("testnet")
          ? "?cluster=testnet"
          : "";
        const solscanLink = `https://solscan.io/tx/${tx}${networkParam}`;
        console.log("🔍 View transaction on Solscan:", solscanLink);
      }

      // 트랜잭션 완료 후 PlayerState를 즉시 다시 가져옵니다.
      try {
        console.log("Transaction after PlayerState manually fetching...");
        // 트랜잭션이 처리될 때까지 짧게 기다립니다.
        await new Promise((resolve) => setTimeout(resolve, 2000));

        const playerData = await program.account.playerState.fetchNullable(
          playerStatePDA
        );
        if (playerData) {
          console.log("New PlayerState data detected");
          // 상태가 변경된 경우에만 업데이트
          setPlayerState((prev) => {
            if (prev && JSON.stringify(prev) === JSON.stringify(playerData)) {
              return prev;
            }
            return playerData as unknown as PlayerState;
          });
        } else {
          console.warn("PlayerState has not been created yet");
        }
      } catch (fetchErr) {
        console.error("Error fetching PlayerState:", fetchErr);
      }
    } catch (err: unknown) {
      console.error("Initialize player error:", err);
      if (err && typeof err === "object") {
        if ("message" in err) {
          console.error("Error message:", (err as { message: string }).message);
        }
        if ("stack" in err) {
          console.error("Error stack:", (err as { stack: string }).stack);
        }
        if ("logs" in err) {
          console.error("Transaction logs:", (err as { logs: string[] }).logs);
        }
      }
    } finally {
      setIsProcessing(false);
    }
  }, [program, wallet, playerStatePDA, isProcessing]);

  // Instruction: Purchase ciphers
  const purchaseCiphers = useCallback(
    async (amount: number) => {
      if (!program) {
        console.error("Purchase ciphers: Program not initialized");
        return;
      }

      if (isProcessing) {
        console.log("Transaction is already in progress");
        return;
      }

      if (!wallet?.publicKey || !playerStatePDA) {
        console.error("Purchase ciphers: Wallet or PlayerStatePDA not found");
        return;
      }

      try {
        setIsProcessing(true);
        console.log(
          `Purchasing ${amount} ciphers with wallet: ${wallet.publicKey.toString()}`
        );

        // 필요한 모든 계정 정보 추가
        const tx = await program.methods
          .purchaseCiphers(new BN(amount))
          .accounts({
            player: wallet.publicKey,
            player_state: playerStatePDA,
            game_state: gameStatePDA,
            system_program: SystemProgram.programId,
          })
          .rpc({ skipPreflight: true }); // Add skipPreflight for better error handling

        console.log("Purchase ciphers: Transaction sent", tx);

        // 네트워크 종류 확인
        const isLocalnet =
          connection.rpcEndpoint.includes("localhost") ||
          connection.rpcEndpoint.includes("127.0.0.1");

        if (isLocalnet) {
          console.log("🖥️ Local Transaction:", tx);
          console.log("💡 To view details, run: solana confirm -v", tx);
          console.log("💡 Or get logs with: solana logs", tx);
        } else {
          // Solscan에서 트랜잭션을 볼 수 있는 링크 생성
          const networkParam = connection.rpcEndpoint.includes("devnet")
            ? "?cluster=devnet"
            : connection.rpcEndpoint.includes("testnet")
            ? "?cluster=testnet"
            : "";
          const solscanLink = `https://solscan.io/tx/${tx}${networkParam}`;
          console.log("🔍 View transaction on Solscan:", solscanLink);
        }

        // 트랜잭션이 처리될 때까지 잠시 기다림
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // PlayerState 다시 가져오기
        try {
          const playerData = await program.account.playerState.fetchNullable(
            playerStatePDA
          );
          if (playerData) {
            console.log("Updated player state after cipher purchase");
            setPlayerState((prev) => {
              if (prev && JSON.stringify(prev) === JSON.stringify(playerData)) {
                return prev;
              }
              return playerData as unknown as PlayerState;
            });
          }
        } catch (fetchErr) {
          console.error("Error fetching PlayerState after purchase:", fetchErr);
        }
      } catch (err: unknown) {
        console.error("Purchase ciphers error:", err);

        // More detailed error information
        if (err && typeof err === "object") {
          if ("logs" in err) {
            console.error(
              "Transaction logs:",
              (err as { logs: string[] }).logs
            );
          }

          if ("message" in err) {
            console.error(
              "Error message:",
              (err as { message: string }).message
            );
          }
        }
      } finally {
        setIsProcessing(false);
      }
    },
    [program, wallet, playerStatePDA, isProcessing, connection, gameStatePDA]
  );

  // Instruction: Make a move
  const makeMove = useCallback(
    async (direction: Direction) => {
      if (!program) return;

      if (isProcessing) {
        console.log("Transaction is already in progress");
        return;
      }

      if (!wallet?.publicKey || !playerStatePDA) {
        console.error("Make move: Wallet or PlayerStatePDA not found");
        return;
      }

      try {
        setIsProcessing(true);
        const tx = await program.methods
          .makeMove(direction === "left" ? { left: {} } : { right: {} })
          .accounts({
            player: wallet.publicKey,
            player_state: playerStatePDA,
            game_state: gameStatePDA,
          })
          .rpc({ skipPreflight: true });

        console.log("Make move: Transaction sent", tx);

        // 네트워크 종류 확인
        const isLocalnet =
          connection.rpcEndpoint.includes("localhost") ||
          connection.rpcEndpoint.includes("127.0.0.1");

        if (isLocalnet) {
          console.log("🖥️ Local Transaction:", tx);
          console.log("💡 To view details, run: solana confirm -v", tx);
          console.log("💡 Or get logs with: solana logs", tx);
        } else {
          // Solscan 링크 생성
          const networkParam = connection.rpcEndpoint.includes("devnet")
            ? "?cluster=devnet"
            : connection.rpcEndpoint.includes("testnet")
            ? "?cluster=testnet"
            : "";
          const solscanLink = `https://solscan.io/tx/${tx}${networkParam}`;
          console.log("🔍 View move transaction on Solscan:", solscanLink);
        }
      } catch (err: unknown) {
        console.error("Make move error:", err);
        if (err && typeof err === "object") {
          if ("message" in err) {
            console.error(
              "Error message:",
              (err as { message: string }).message
            );
          }
          if ("logs" in err) {
            console.error(
              "Transaction logs:",
              (err as { logs: string[] }).logs
            );
          }
        }
      } finally {
        setIsProcessing(false);
      }
    },
    [program, wallet, playerStatePDA, gameStatePDA, isProcessing, connection]
  );

  const value = {
    program,
    gameState,
    playerState,
    gameStatePDA,
    playerStatePDA,
    initializeGame,
    initializePlayer,
    purchaseCiphers,
    makeMove,
    isProcessing,
  };

  return (
    <BlockrunnersContext.Provider value={value}>
      {children}
    </BlockrunnersContext.Provider>
  );
}

export default BlockrunnersProvider;
