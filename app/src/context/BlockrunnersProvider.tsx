import { useState, useEffect, ReactNode } from "react";
import { useConnection, useAnchorWallet } from "@solana/wallet-adapter-react";
import { BN } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { EMPTY_CARD_USAGE, gameStatePDA, getPlayerStatePDA } from "../lib/constants";
import type {
  CardUsage,
  GameState,
  PlayerState,
  SocialFeedEvent,
  SocialFeedEventInState,
} from "../lib/types";
import { BlockrunnersContext } from "../hooks/useBlockrunners";
import { useProgram } from "@/hooks/useProgram";
import { generateId } from "@/lib/utils";
import { AbilityCard } from "@/lib/types";

function BlockrunnersProvider({ children }: { children: ReactNode }) {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();
  const program = useProgram();

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [playerState, setPlayerState] = useState<PlayerState | null>(null);
  const [playerStatePDA, setPlayerStatePDA] = useState<PublicKey | null>(null);
  const [cardUsage, setCardUsage] = useState<CardUsage>(EMPTY_CARD_USAGE);
  const [selectedCards, setSelectedCards] = useState<AbilityCard[]>([]);
  const [socialFeed, setSocialFeed] = useState<SocialFeedEventInState[]>([]);

  const selectCard = (card: AbilityCard) => {
    if (!selectedCards.some((c) => c.id === card.id)) {
      setSelectedCards((prev) => [...prev, card]);

      // Update card usage state for the on-chain transaction
      if (card.type === "shield") {
        setCardUsage((prev: CardUsage) => ({ ...prev, shield: true }));
      } else if (card.type === "doubler") {
        setCardUsage((prev: CardUsage) => ({ ...prev, doubler: true }));
      } else if (card.type === "swift") {
        setCardUsage((prev: CardUsage) => ({ ...prev, swift: true }));
      }
    }
  };

  const deselectCard = (cardId: string) => {
    const card = selectedCards.find((c) => c.id === cardId);
    setSelectedCards((prev) => prev.filter((card) => card.id !== cardId));

    // Update card usage state for the on-chain transaction
    if (card?.type === "shield") {
      setCardUsage((prev: CardUsage) => ({ ...prev, shield: false }));
    } else if (card?.type === "doubler") {
      setCardUsage((prev: CardUsage) => ({ ...prev, doubler: false }));
    } else if (card?.type === "swift") {
      setCardUsage((prev: CardUsage) => ({ ...prev, swift: false }));
    }
  };

  // Keep track of available cards from blockchain and handle selection by type
  useEffect(() => {
    // If player state changes and there are new cards, update selection state if needed
    if (playerState && playerState.cards) {
      // Reset selections when player state changes significantly
      if (playerState.randomnessAccount === null && selectedCards.length > 0) {
        // Only reset if we've completed a move
        setSelectedCards([]);
        setCardUsage(EMPTY_CARD_USAGE);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerState?.randomnessAccount]);

  const addToFeed = (events: SocialFeedEvent[]) => {
    if (events.length === 0) return;

    setSocialFeed((prevFeed) => {
      if (prevFeed.length === 0) {
        return events.map((event) => ({
          id: generateId(),
          message: event.message,
          timestamp: event.timestamp.toNumber(),
          isNew: true,
        }));
      }

      // Filter out events that already exist in the feed (same message and timestamp)
      const existingEventKeys = new Set(
        prevFeed.map((item) => `${item.message}-${item.timestamp}`)
      );

      const newEvents = events
        .filter((event) => {
          const eventKey = `${event.message}-${event.timestamp.toNumber()}`;
          return !existingEventKeys.has(eventKey);
        })
        .sort((a, b) => a.timestamp.toNumber() - b.timestamp.toNumber());

      // If no new events, return the existing feed
      if (newEvents.length === 0) {
        return prevFeed;
      }

      const newFeed = [
        ...prevFeed.map((item) => ({ ...item, isNew: false })),
        ...newEvents.map((event) => ({
          id: generateId(),
          message: event.message,
          timestamp: event.timestamp.toNumber(),
          isNew: true,
        })),
      ];

      // Sort by timestamp to maintain chronological order
      newFeed.sort((a, b) => a.timestamp - b.timestamp);

      // Keep only the last 10 messages
      if (newFeed.length > 10) {
        newFeed.splice(0, newFeed.length - 10);
      }

      return newFeed;
    });
  };

  // Set up subscription to emitted events
  // This is not necessary as we are using the onAccountChange method to get the GameState and PlayerState
  // useEffect(() => {
  //   if (!program) return;

  //   const emitLogSubscriptionId = program.addEventListener("socialFeedEvent", (event) => {
  //     addToFeed(findNewEvents([event]));
  //   });

  //   return () => {
  //     program.removeEventListener(emitLogSubscriptionId);
  //   };

  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [program]);

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

      // Extract social feed events from GameState and add to feed
      addToFeed(decodedGameState.gameEvents);
    });

    // Fetch GameState PDA initially
    program.account.gameState
      .fetchNullable(gameStatePDA)
      .then((data) => {
        if (data) {
          console.log("GameState fetched", data);
          setGameState(data as GameState);
          addToFeed(data.gameEvents);
        } else {
          console.log("GameState does not exist yet - may need initialization");
        }
      })
      .catch((error) => {
        console.log("GameState fetch error", error.message);
      });

    return () => {
      connection.removeAccountChangeListener(gameSubscriptionId);
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

      // Extract social feed events from PlayerState and add to feed
      addToFeed(decodedPlayerState.playerEvents);
    });

    // Fetch PlayerState PDA initially
    program.account.playerState
      .fetchNullable(pda)
      .then((data) => {
        if (data) {
          console.log("PlayerState fetched", data);
          setPlayerState(data as PlayerState);
          addToFeed(data.playerEvents);
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

    if (!gameState || !gameState.authority) {
      console.error("Purchase ciphers: Game state or admin authority not found");
      return;
    }

    program.methods
      .purchaseCiphers(new BN(amount))
      .accounts({
        player: wallet.publicKey,
        adminWallet: gameState.authority,
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
    selectedCards,
    setSelectedCards,
    socialFeed,
    setSocialFeed,
    cardUsage,
    setCardUsage,
    purchaseCiphers,
    selectCard,
    deselectCard,
  }; // Context value containing only necessary properties and methods

  return <BlockrunnersContext.Provider value={value}>{children}</BlockrunnersContext.Provider>;
}

export default BlockrunnersProvider;
