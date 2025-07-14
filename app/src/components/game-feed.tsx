"use client";

import { useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { useBlockrunners } from "@/hooks/useBlockrunners";

export function GameFeed() {
  const { socialFeed } = useBlockrunners();

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
      return "border-purple-500";
    }
    if (message.includes("PERSONAL BEST") || message.includes("STREAK RECORD")) {
      return "border-yellow-500";
    }
    if (message.includes("CONSENSUS") || message.includes("BREACH")) {
      return "border-red-500";
    }
    if (message.includes("SYSTEM") || message.includes("INTRUSION")) {
      return "border-orange-500";
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

  // Use socialFeed directly - it already includes both game and player events
  // and is properly deduplicated and limited to 10 messages
  const sortedFeed = socialFeed
    .map((msg) => ({
      ...msg,
      isPrivate: false, // All current messages are from social feed (public)
    }))
    .sort((a, b) => a.timestamp - b.timestamp);

  return (
    <Card className="h-full flex flex-col overflow-hidden border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-2" ref={scrollRef}>
          {sortedFeed.map((message) => (
            <div
              key={message.id}
              className={`p-3 border-2 rounded-md transition-all ${getCategoryColor(
                message.message
              )} ${message.isNew ? "animate-pulse" : ""}`}
            >
              <p className="text-xs text-gray-400 font-mono">
                {getMessageIcon(message.message)}{" "}
                {new Date(message.timestamp * 1000).toLocaleTimeString()}
              </p>
              <p className="font-mono text-xs leading-relaxed">{message.message}</p>
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
}
