"use client";

import { useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { useBlockrunners } from "@/hooks/useBlockrunners";

export function GameFeed() {
  const { socialFeed } = useBlockrunners();

  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const prevTimestamp = socialFeed[socialFeed.length - 1].timestamp;

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (scrollRef.current) {
      scrollRef.current.lastElementChild?.scrollIntoView({ behavior: "smooth" });
    }
  }, [prevTimestamp]);

  return (
    <Card className="flex-1 overflow-hidden border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] min-h-[30vh]">
      <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
        <div className="space-y-2" ref={scrollRef}>
          {socialFeed.map((message) => (
            <div
              key={message.id}
              className={`p-2 bg-[#f8f8f8] dark:bg-[#1e1e1e] border-2 border-black rounded-md transition-all ${
                message.isNew ? "animate-pulse bg-[#fffde7]" : ""
              }`}
            >
              <p className="font-mono text-sm">{message.message}</p>
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
}
