import { useState, useEffect, ReactNode } from "react";
import { useConnection, useAnchorWallet } from "@solana/wallet-adapter-react";
import { BN } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { gameStatePDA, getPlayerStatePDA } from "../lib/constants";
import type { Direction, GameState, PlayerState } from "../types/types";
import { BlockrunnersContext } from "../hooks/useBlockrunners";
import { useProgram } from "@/hooks/useProgram";

function BlockrunnersProvider({ children }: { children: ReactNode }) {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [playerState, setPlayerState] = useState<PlayerState | null>(null);
  const [playerStatePDA, setPlayerStatePDA] = useState<PublicKey | null>(null);

  const program = useProgram();

  // Get GameState on load
  useEffect(() => {
    if (!program) return;

    // Set up subscription to GameState PDA
    const gameSubscriptionId = connection.onAccountChange(gameStatePDA, (accountInfo) => {
      setGameState(program.coder.accounts.decode<GameState>("gameState", accountInfo.data));
    });

    // Set up subscription to SocialFeed PDA
    const emitLogSubscriptionId = program.addEventListener(
      "socialFeedEvent", // TODO: Any other events?
      (event) => {
        // TODO: Add this to state
        console.log("Event Data:", event);
      }
    );

    // Fetch GameState PDA initially
    program.account.gameState
      .fetchNullable(gameStatePDA)
      .then((data) => {
        if (data) {
          setGameState(data);
        } else {
          console.log("GameState does not exist yet - may need initialization");
        }
      })
      .catch((error) => {
        console.log("GameState fetch error", error.message);
      });

    return () => {
      connection.removeAccountChangeListener(gameSubscriptionId);
      program.removeEventListener(emitLogSubscriptionId);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connection]);

  // Get PlayerState upon public key change
  useEffect(() => {
    setPlayerState(null);
    setPlayerStatePDA(null);

    if (!program || !wallet?.publicKey) return;

    // Determine PlayerState PDA address
    const pda = getPlayerStatePDA(wallet.publicKey);
    setPlayerStatePDA(pda);

    // Set up subscription to PlayerState PDA
    const playerSubscriptionId = connection.onAccountChange(pda, (accountInfo) => {
      setPlayerState(program.coder.accounts.decode<PlayerState>("playerState", accountInfo.data));
    });

    // Fetch PlayerState PDA initially
    program.account.playerState
      .fetchNullable(pda)
      .then((data) => {
        if (data) {
          setPlayerState(data);
        } else {
          console.log("PlayerState does not exist yet - may need initialization");
        }
      })
      .catch((error) => {
        console.log("PlayerState fetch error", error.message);
      });

    // Cleanup subscriptions
    return () => {
      connection.removeAccountChangeListener(playerSubscriptionId);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connection, wallet?.publicKey]);

  // Instruction: Initialize game
  const initializeGame = async () => {
    if (!program) return;
    if (gameState) {
      console.error("Initialize game: GameState already exists");
      return;
    }

    if (!wallet?.publicKey) {
      console.error("Initialize game: Wallet not found");
      return;
    }

    program.methods
      .initializeGame()
      .accounts({
        admin: wallet.publicKey,
      })
      .rpc()
      .then((tx) => {
        console.log("Initialize game: Transaction sent", tx);
      })
      .catch((err) => {
        console.error("Initialize game:", err);
      });
  };

  // Instruction: Initialize player
  const initializePlayer = async () => {
    if (!program) return;

    console.log("Initialize player: Wallet", wallet?.publicKey);
    console.log("Initialize player: PlayerStatePDA", playerStatePDA);
    if (!wallet?.publicKey || !playerStatePDA) {
      console.error("Initialize player: Wallet or PlayerStatePDA not found");
      return;
    }

    program.methods
      .initializePlayer()
      .accounts({
        player: wallet.publicKey,
      })
      .rpc()
      .then((tx) => {
        console.log("Initialize player: Transaction sent", tx);
      })
      .catch((err) => {
        console.error("Initialize player:", err);
      });
  };

  // Instruction: Purchase ciphers
  const purchaseCiphers = async (amount: number) => {
    if (!program) return;

    if (!wallet?.publicKey || !playerStatePDA) {
      console.error("Purchase ciphers: Wallet or PlayerStatePDA not found");
      return;
    }

    program.methods
      .purchaseCiphers(new BN(amount))
      .accounts({
        player: wallet.publicKey,
      })
      .rpc()
      .then((tx) => {
        console.log("Purchase ciphers: Transaction sent", tx);
      })
      .catch((err) => {
        console.error("Purchase ciphers:", err);
      });
  };

  // Instruction: Make a move
  const makeMove = async (direction: Direction) => {
    if (!program) return;
    if (!wallet?.publicKey || !playerStatePDA) {
      console.error("Make move: Wallet or PlayerStatePDA not found");
      return;
    }

    program.methods
      .makeMove(direction === "left" ? { left: {} } : { right: {} })
      .rpc()
      .then((tx) => {
        console.log("Make move: Transaction sent", tx);
      })
      .catch((err) => {
        console.error("Make move:", err);
      });
  };

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
  };

  return <BlockrunnersContext.Provider value={value}>{children}</BlockrunnersContext.Provider>;
}

export default BlockrunnersProvider;
