import { useState, useEffect, ReactNode } from "react";
import { useConnection, useAnchorWallet } from "@solana/wallet-adapter-react";
import { BN } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { EMPTY_CARD_USAGE, gameStatePDA, getPlayerStatePDA } from "../lib/constants";
import type { CardUsage, GameState, PlayerState, SocialFeedEvent } from "../lib/types";
import { BlockrunnersContext } from "../hooks/useBlockrunners";
import { useProgram } from "@/hooks/useProgram";
import { generateId } from "@/lib/utils";
import { AbilityCard } from "@/lib/types";

function BlockrunnersProvider({ children }: { children: ReactNode }) {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [playerState, setPlayerState] = useState<PlayerState | null>(null);
  const [playerStatePDA, setPlayerStatePDA] = useState<PublicKey | null>(null);
  const [socialFeeds, setSocialFeeds] = useState<SocialFeedEvent[]>([]);
  const [cardUsage, setCardUsage] = useState<CardUsage>(EMPTY_CARD_USAGE);

  // UI state for cards and selection
  const [selectedCards, setSelectedCards] = useState<AbilityCard[]>([]);
  const [socialFeed, setSocialFeed] = useState<
    { id: string; message: string; timestamp: number; isNew: boolean }[]
  >([{ id: generateId(), message: "Welcome Runner!", timestamp: Date.now(), isNew: false }]);

  const program = useProgram();

  const selectCard = (card: AbilityCard) => {
    if (!selectedCards.some((c) => c.id === card.id)) {
      setSelectedCards((prev) => [...prev, card]);

      // Update card usage state for the on-chain transaction
      if (card.type === "shield") {
        setCardUsage((prev) => ({ ...prev, shield: true }));
      } else if (card.type === "doubler") {
        setCardUsage((prev) => ({ ...prev, doubler: true }));
      } else if (card.type === "swift") {
        setCardUsage((prev) => ({ ...prev, swift: true }));
      }
    }
  };

  const deselectCard = (cardId: string) => {
    const card = selectedCards.find((c) => c.id === cardId);
    setSelectedCards((prev) => prev.filter((card) => card.id !== cardId));

    // Update card usage state for the on-chain transaction
    if (card?.type === "shield") {
      setCardUsage((prev) => ({ ...prev, shield: false }));
    } else if (card?.type === "doubler") {
      setCardUsage((prev) => ({ ...prev, doubler: false }));
    } else if (card?.type === "swift") {
      setCardUsage((prev) => ({ ...prev, swift: false }));
    }
  };

  // Keep track of available cards from blockchain and handle selection by type
  // TODO: Should be checking randomnessAccount instead of moveDirection
  useEffect(() => {
    // If player state changes and there are new cards, update selection state if needed
    if (playerState && playerState.cards) {
      // Reset selections when player state changes significantly
      if (playerState.moveDirection === null && selectedCards.length > 0) {
        // Only reset if we've completed a move
        setSelectedCards([]);
        setCardUsage(EMPTY_CARD_USAGE);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerState?.moveDirection]);

  const addToFeed = (message: string) => {
    setSocialFeed((prevFeed) => {
      const newFeed = [
        ...prevFeed.map((item) => ({ ...item, isNew: false })),
        { id: generateId(), message, timestamp: Date.now(), isNew: true },
      ];

      // Keep only the last 20 messages
      if (newFeed.length > 20) {
        newFeed.splice(0, newFeed.length - 20);
      }

      return newFeed;
    });
  };

  // Get GameState on load
  useEffect(() => {
    if (!program) return;

    // Set up subscription to GameState PDA
    const gameSubscriptionId = connection.onAccountChange(gameStatePDA, (accountInfo) => {
      const decodedGameState = program.coder.accounts.decode<GameState>(
        "gameState",
        accountInfo.data
      );
      console.log("GameState changed", decodedGameState);
      setGameState(decodedGameState);
    });

    // Set up subscription to SocialFeed PDA
    const emitLogSubscriptionId = program.addEventListener(
      "socialFeedEvent", // TODO: Any other events?
      (event) => {
        console.log("Event Data:", event);
        setSocialFeeds((prevState) => {
          return [...prevState, event];
        });
      }
    );

    // Fetch GameState PDA initially
    program.account.gameState
      .fetchNullable(gameStatePDA)
      .then((data) => {
        if (data) {
          console.log("GameState fetched", data);
          setGameState(data as GameState);
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
      const decodedPlayerState = program.coder.accounts.decode<PlayerState>(
        "playerState",
        accountInfo.data
      );
      console.log("PlayerState changed", decodedPlayerState);
      setPlayerState(decodedPlayerState);
    });

    // Fetch PlayerState PDA initially
    program.account.playerState
      .fetchNullable(pda)
      .then((data) => {
        if (data) {
          console.log("PlayerState fetched", data);
          setPlayerState(data as PlayerState);
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

  const value = {
    program,
    gameState,
    playerState,
    gameStatePDA,
    playerStatePDA,
    socialFeeds,
    cardUsage,
    selectedCards,
    socialFeed,
    setCardUsage,
    purchaseCiphers,
    selectCard,
    deselectCard,
    addToFeed,
  }; // Context value containing only necessary properties and methods

  return <BlockrunnersContext.Provider value={value}>{children}</BlockrunnersContext.Provider>;
}

export default BlockrunnersProvider;
