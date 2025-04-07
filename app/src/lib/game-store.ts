import { create } from "zustand";
import { CardType, AbilityCard, FeedMessage, Direction } from "@/types/game";

// Constants
const PATH_LENGTH = 20;
const STARTING_CIPHERS = 5;
const CIPHER_COST = 1;

// Random ID generator
const generateId = () => Math.random().toString(36).substring(2, 11);

interface State {
  // Game state
  isInitialized: boolean;
  prizePool: number;
  pathLength: number;
  gameCompleted: boolean;
  winner: string | null;

  // Player state
  playerId: string;
  playerName: string;
  playerPosition: number;
  ciphers: number;
  cards: AbilityCard[];

  // Path info
  playerPath: Direction[];

  // Social feed
  socialFeed: FeedMessage[];

  // UI state
  selectedCards: AbilityCard[];

  // Actions
  initializeGame: () => void;
  generatePath: () => void;
  makeMove: (direction: Direction) => void;
  buyCiphers: (amount: number) => void;
  useCard: (cardId: string) => void;
  selectCard: (card: AbilityCard) => void;
  deselectCard: (cardId: string) => void;
  resetSelectedCards: () => void;

  // Helper methods
  addToFeed: (message: string) => void;
  giveCards: (count: number) => void;
  completeGame: () => void;
  resyncCards: () => void;
}

export const useStore = create<State>((set, get) => ({
  // Initial game state
  isInitialized: false,
  prizePool: 0,
  pathLength: PATH_LENGTH,
  gameCompleted: false,
  winner: null,

  // Player state
  playerId: generateId(),
  playerName: `Runner #${Math.floor(Math.random() * 1000)}`,
  playerPosition: 0,
  ciphers: STARTING_CIPHERS,
  cards: [],

  // Path info
  playerPath: [],

  // Social feed
  socialFeed: [
    { id: generateId(), message: "Welcome to Blockrunners!", timestamp: Date.now(), isNew: false },
    {
      id: generateId(),
      message: "Use cards wisely to navigate through the blockchain.",
      timestamp: Date.now() - 1000,
      isNew: false,
    },
  ],

  // UI state
  selectedCards: [],

  // Actions
  initializeGame: () => {
    const state = get();
    if (!state.isInitialized) {
      set({
        isInitialized: true,
        gameCompleted: false,
        winner: null,
        playerPosition: 0,
        ciphers: STARTING_CIPHERS,
        cards: [],
        socialFeed: [
          ...state.socialFeed,
          {
            id: generateId(),
            message: `${state.playerName} has joined the game!`,
            timestamp: Date.now(),
            isNew: true,
          },
        ],
      });

      get().generatePath();

      // Give initial cards to the player
      get().giveCards(1);

      // Force a state resync to ensure all components have the latest state
      setTimeout(() => {
        // get().resyncCards();
      }, 10);
    }
  },

  generatePath: () => {
    const path: Direction[] = [];

    for (let i = 0; i < PATH_LENGTH; i++) {
      path.push(Math.random() < 0.5 ? "left" : "right");
    }

    set({ playerPath: path });

    // Debug information to console
    console.log("Generated new path:", path);
  },

  makeMove: (direction: Direction) => {
    const state = get();
    const { playerPosition, playerPath, ciphers, selectedCards } = state;

    // Calculate cost with selected cards
    // Base cost is 1 + number of selected cards
    let moveCost = 1 + selectedCards.length;

    // Apply Swift card effect if present (reduces cost by 2, but never below 0)
    if (selectedCards.some((card) => card.type === "swift")) {
      moveCost = Math.max(0, moveCost - 2);
    }

    // Check if player has enough ciphers
    if (ciphers < moveCost) {
      get().addToFeed(`Not enough ciphers for this move!`);
      return;
    }

    // Consume ciphers
    set({ ciphers: ciphers - moveCost });

    // Check if the move is correct
    const isCorrect = playerPath[playerPosition] === direction;

    // Use shield card if selected and move is incorrect
    const hasShield = selectedCards.some((card) => card.type === "shield");

    if (isCorrect) {
      // Correct move
      const newPosition = playerPosition + 1;

      // Check if player has reached the end
      if (newPosition >= state.pathLength) {
        // Player wins
        get().completeGame();
        return;
      }

      // Update position
      set({ playerPosition: newPosition });

      // Add message to feed
      get().addToFeed(`Moved ${direction}. Correct path! Advanced to position ${newPosition}.`);

      // Check if doubler card was used
      const hasDoubler = selectedCards.some((card) => card.type === "doubler");

      // Award new card(s)
      const cardsToAward = hasDoubler ? 2 : 1;
      get().giveCards(cardsToAward);
    } else {
      // Incorrect move
      if (hasShield) {
        get().addToFeed(
          `Moved ${direction}. Incorrect path! Shield card protected you from reset.`
        );

        // Remove shield card
        const shieldCard = selectedCards.find((card) => card.type === "shield");
        if (shieldCard) {
          set((state) => ({
            cards: state.cards.filter((card) => card.id !== shieldCard.id),
          }));

          // Force a state resync to ensure all components have the latest state
          setTimeout(() => {
            // get().resyncCards();
          }, 10);
        }
      } else {
        // Reset player to start and regenerate path
        set({
          playerPosition: 0,
          cards: [],
        });

        // Generate a new random path when player resets
        get().generatePath();

        // Give some starting cards
        get().giveCards(1);

        get().addToFeed(`Moved ${direction}. Incorrect path! Reset to position 0 with a new path.`);
      }
    }

    // Remove used cards from player's hand
    const usedCardIds = selectedCards.map((card) => card.id);
    set((state) => ({
      cards: state.cards.filter((card) => !usedCardIds.includes(card.id)),
      selectedCards: [],
    }));

    // Force a state resync to ensure all components have the latest state
    setTimeout(() => {
      // get().resyncCards();
    }, 10);
  },

  buyCiphers: (amount: number) => {
    const state = get();
    const cost = amount * CIPHER_COST;

    // Simulate payment and increase prize pool
    set({
      ciphers: state.ciphers + amount,
      prizePool: state.prizePool + cost * 0.4, // 40% goes to prize pool as per README
    });

    get().addToFeed(`Purchased ${amount} ciphers for ${cost} SOL.`);
  },

  useCard: (cardId: string) => {
    const state = get();
    const card = state.cards.find((c) => c.id === cardId);

    if (!card) {
      console.error("Card not found:", cardId);
      return;
    }

    get().addToFeed(`Used ${card.name} card.`);

    // Mark card as used
    set((state) => ({
      cards: state.cards.map((c) => (c.id === cardId ? { ...c, used: true, result: "" } : c)),
    }));
  },

  selectCard: (card: AbilityCard) => {
    const { selectedCards } = get();

    // Check if the card is already selected
    if (!selectedCards.some((c) => c.id === card.id)) {
      set({ selectedCards: [...selectedCards, card] });
    }
  },

  deselectCard: (cardId: string) => {
    const { selectedCards } = get();
    set({ selectedCards: selectedCards.filter((card) => card.id !== cardId) });
  },

  resetSelectedCards: () => {
    set({ selectedCards: [] });
  },

  // Helper methods
  addToFeed: (message: string) => {
    const { socialFeed } = get();

    const newFeed = [
      ...socialFeed.map((item) => ({ ...item, isNew: false })),
      { id: generateId(), message, timestamp: Date.now(), isNew: true },
    ];

    // Keep only the last 20 messages
    if (newFeed.length > 20) {
      newFeed.splice(0, newFeed.length - 20);
    }

    set({ socialFeed: newFeed });
  },

  giveCards: (count: number) => {
    console.log(`Batch awarding ${count} cards`);
    const newCards: AbilityCard[] = [];
    const cardTypes: CardType[] = ["shield", "doubler", "swift"];

    for (let i = 0; i < count; i++) {
      const randomType = cardTypes[Math.floor(Math.random() * cardTypes.length)];
      const newCard: AbilityCard = {
        id: generateId(),
        type: randomType,
        name: randomType.charAt(0).toUpperCase() + randomType.slice(1),
        description: getCardDescription(randomType),
        icon: getCardIcon(randomType),
        used: false,
        result: null,
      };
      newCards.push(newCard);
      console.log("Generated new card:", newCard);
    }

    // Use a pure function approach to ensure state immutability
    set((state) => {
      // Create a completely new array to ensure reference changes
      const updatedCards = [...state.cards, ...newCards];
      console.log("Setting cards with length:", updatedCards.length);
      return { cards: updatedCards };
    });

    // Force a state resync to ensure all components have the latest state
    setTimeout(() => {
      // get().resyncCards();
    }, 10);

    // Add messages to feed after state update to avoid race conditions
    setTimeout(() => {
      newCards.forEach((card) => {
        get().addToFeed(`You found a ${card.name} card!`);
      });
      console.log("Current cards after batch:", get().cards);
    }, 20);
  },

  completeGame: () => {
    const state = get();

    set({
      gameCompleted: true,
      winner: state.playerName,
    });

    get().addToFeed(`${state.playerName} has won the game and claimed ${state.prizePool} SOL!`);

    // Reset the game after a delay
    setTimeout(() => {
      set({
        prizePool: 0,
        isInitialized: false,
        gameCompleted: false,
        winner: null,
      });

      get().initializeGame();
    }, 5000);
  },

  // Force a resync of the cards array to ensure components re-render
  resyncCards: () => {
    console.log("Resyncing cards state");
    set((state) => {
      // Create a deep copy of the cards array to force a reference change
      return { cards: JSON.parse(JSON.stringify(state.cards)) };
    });
  },
}));

// Helper functions
function getCardDescription(type: CardType): string {
  switch (type) {
    case "shield":
      return "Prevents a reset if the next step is incorrect.";
    case "doubler":
      return "The next correct step gives two random cards.";
    case "swift":
      return "The next step costs two less ciphers than it would.";
    default:
      return "";
  }
}

function getCardIcon(type: CardType): string {
  switch (type) {
    case "shield":
      return "shield";
    case "doubler":
      return "copy";
    case "swift":
      return "zap";
    default:
      return "";
  }
}