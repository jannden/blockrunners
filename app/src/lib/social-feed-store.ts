import { create } from "zustand";

import { MAX_FEED_EVENTS } from "./constants";
import { FeedMessage } from "@/types/game";

// Random ID generator
const generateId = () => Math.random().toString(36).substring(2, 11);

interface SocialFeedState {
  // Feed messages
  feedMessages: FeedMessage[];

  // Actions
  addMessage: (message: string) => void;
  markAllAsRead: () => void;
  clearFeed: () => void;
}

export const useSocialFeedStore = create<SocialFeedState>((set, get) => ({
  // Initial feed state
  feedMessages: [
    { id: generateId(), message: "Welcome to Blockrunners!", timestamp: Date.now(), isNew: true },
    {
      id: generateId(),
      message: "Use cards wisely to navigate through the blockchain.",
      timestamp: Date.now() - 1000,
      isNew: true,
    },
  ],

  // Add a message to the feed
  addMessage: (message: string) => {
    const { feedMessages } = get();

    const newFeed = [
      ...feedMessages.map((item) => ({ ...item, isNew: false })),
      { id: generateId(), message, timestamp: Date.now(), isNew: true },
    ];

    // Keep only the last MAX_FEED_EVENTS messages
    if (newFeed.length > MAX_FEED_EVENTS) {
      newFeed.splice(0, newFeed.length - MAX_FEED_EVENTS);
    }

    set({ feedMessages: newFeed });
  },

  // Mark all messages as read
  markAllAsRead: () => {
    set((state) => ({
      feedMessages: state.feedMessages.map((msg) => ({ ...msg, isNew: false })),
    }));
  },

  // Clear feed
  clearFeed: () => {
    set({ feedMessages: [] });
  },
}));
