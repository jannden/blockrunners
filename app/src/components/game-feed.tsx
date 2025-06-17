"use client";

import { useEffect, useRef, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useBlockrunners } from "@/hooks/useBlockrunners";
import { SocialFeedEvent } from "@/lib/types";

interface FeedToggle {
  public: boolean;
  private: boolean;
}

export function GameFeed() {
  const { socialFeed, playerState } = useBlockrunners();
  const [feedToggle, setFeedToggle] = useState<FeedToggle>({ public: true, private: true });

  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const prevTimestamp = socialFeed[socialFeed.length - 1]?.timestamp || 0;

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (scrollRef.current) {
      scrollRef.current.lastElementChild?.scrollIntoView({ behavior: "smooth" });
    }
  }, [prevTimestamp]);

  // Categorize messages by type for better display
  const getCategoryColor = (message: string): string => {
    if (message.includes("ACHIEVEMENT") || message.includes("PROTOCOL FRAGMENT")) {
      return "bg-purple-900 border-purple-500";
    }
    if (message.includes("PERSONAL BEST") || message.includes("STREAK RECORD")) {
      return "bg-gold-900 border-yellow-500";
    }
    if (message.includes("CONSENSUS") || message.includes("BREACH")) {
      return "bg-red-900 border-red-500";
    }
    if (message.includes("SYSTEM") || message.includes("INTRUSION")) {
      return "bg-orange-900 border-orange-500";
    }
    return "bg-[#f8f8f8] dark:bg-[#1e1e1e] border-gray-400";
  };

  const getMessageIcon = (message: string): string => {
    if (message.includes("ACHIEVEMENT") || message.includes("PROTOCOL FRAGMENT")) return "🏆";
    if (message.includes("PERSONAL BEST") || message.includes("STREAK RECORD")) return "⚡";
    if (message.includes("CONSENSUS") || message.includes("BREACH")) return "🚨";
    if (message.includes("SYSTEM") || message.includes("INTRUSION")) return "💀";
    if (message.includes("RESOURCES") || message.includes("CIPHERS")) return "🔋";
    if (message.includes("Shield")) return "🛡️";
    return "📡";
  };

  // Combine public and private feeds with metadata
  const combinedFeed = socialFeed.map((msg) => ({
    ...msg,
    isPrivate: false, // All current messages are from social feed (public)
  }));

  // Add player-specific events if available
  if (playerState?.playerEvents) {
    const privateEvents = playerState.playerEvents.map((event: SocialFeedEvent) => ({
      id: `private-${event.timestamp}`,
      message: event.message,
      timestamp: typeof event.timestamp === "object" ? event.timestamp.toNumber() : event.timestamp,
      isNew: false,
      isPrivate: true,
    }));
    combinedFeed.push(...privateEvents);
  }

  // Sort by timestamp
  const sortedFeed = combinedFeed.sort((a, b) => a.timestamp - b.timestamp);

  // Filter based on toggle
  const filteredFeed = sortedFeed.filter(
    (msg) => (msg.isPrivate && feedToggle.private) || (!msg.isPrivate && feedToggle.public)
  );

  return (
    <Card className="flex-1 overflow-hidden border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] min-h-[30vh]">
      <div className="p-2 border-b-2 border-black bg-gray-100 dark:bg-gray-900">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-mono font-bold text-sm">RUNNER COMMUNICATIONS</h3>
          <div className="flex gap-2">
            <Badge
              variant={feedToggle.public ? "default" : "outline"}
              className="cursor-pointer font-mono text-xs"
              onClick={() => setFeedToggle((prev) => ({ ...prev, public: !prev.public }))}
            >
              GLOBAL FEED
            </Badge>
            <Badge
              variant={feedToggle.private ? "default" : "outline"}
              className="cursor-pointer font-mono text-xs"
              onClick={() => setFeedToggle((prev) => ({ ...prev, private: !prev.private }))}
            >
              PERSONAL LOG
            </Badge>
          </div>
        </div>
      </div>
      <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
        <div className="space-y-2" ref={scrollRef}>
          {filteredFeed.map((message) => (
            <div
              key={message.id}
              className={`p-3 border-2 rounded-md transition-all ${getCategoryColor(
                message.message
              )} ${message.isNew ? "animate-pulse" : ""}`}
            >
              <div className="flex items-start gap-2">
                <span className="text-sm">{getMessageIcon(message.message)}</span>
                <div className="flex-1">
                  <p className="font-mono text-xs leading-relaxed text-white">{message.message}</p>
                  <div className="flex items-center justify-between mt-1">
                    <Badge variant="outline" className="text-xs">
                      {message.isPrivate ? "PRIVATE" : "GLOBAL"}
                    </Badge>
                    <span className="text-xs text-gray-400 font-mono">
                      {new Date(message.timestamp * 1000).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {filteredFeed.length === 0 && (
            <div className="text-center py-8 text-gray-500 font-mono">
              <p>No transmissions detected...</p>
              <p className="text-xs mt-2">Monitoring all channels for runner activity.</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </Card>
  );
}
