import { useState, useEffect, ReactNode } from "react";
import { useConnection, useAnchorWallet } from "@solana/wallet-adapter-react";
import { BN } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { gameStatePDA, getPlayerStatePDA, getProgram } from "../lib/constants";
import type { Direction, GameState, PlayerState } from "../types/types";
import { useAnchorProvider } from "../hooks/useAnchorProvider";
import { BlockrunnersContext } from "../hooks/useBlockrunners";

function BlockrunnersProvider({ children }: { children: ReactNode }) {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  const [isGameLoaded, setIsGameLoaded] = useState(false);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [playerState, setPlayerState] = useState<PlayerState | null>(null);
  const [playerStatePDA, setPlayerStatePDA] = useState<PublicKey | null>(null);

  const provider = useAnchorProvider();
  const program = getProgram(provider);

  // Get GameState on load
  useEffect(() => {
    // Fetch GameState PDA initially
    program.account.gameState
      .fetch(gameStatePDA)
      .then((data) => {
        setGameState(data);
        setIsGameLoaded(true);
      })
      .catch((error) => {
        console.error("GameState PDA fetch error:", error);
      });

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

    return () => {
      connection.removeAccountChangeListener(gameSubscriptionId);
      program.removeEventListener(emitLogSubscriptionId);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Get PlayerState upon public key change
  // TODO: This is doing race condition with the game state
  useEffect(() => {
    setPlayerState(null);

    if (!wallet?.publicKey || !isGameLoaded) return;

    if (!gameState) {
      console.error("PlayerState: GameState not found");
      return;
    }

    // Determine PlayerState PDA address
    const pda = getPlayerStatePDA(wallet.publicKey);
    setPlayerStatePDA(pda);

    // Fetch PlayerState PDA initially
    program.account.playerState
      .fetch(pda)
      .then((data) => {
        setPlayerState(data);
      })
      .catch((error) => {
        console.error("PlayerState PDA fetch error:", error);
      });

    // Set up subscription to PlayerState PDA
    const playerSubscriptionId = connection.onAccountChange(pda, (accountInfo) => {
      setPlayerState(program.coder.accounts.decode<PlayerState>("playerState", accountInfo.data));
    });

    // Cleanup subscriptions
    return () => {
      connection.removeAccountChangeListener(playerSubscriptionId);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet?.publicKey, isGameLoaded]);

  // Instruction: Initialize game
  const initializeGame = async () => {
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
