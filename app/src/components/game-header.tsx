import { CircleDollarSign, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GameHeaderProps {
  ciphers: number;
  onInfoClick: () => void;
  onBuyCiphersClick: () => void;
}

export function GameHeader({ ciphers, onInfoClick, onBuyCiphersClick }: GameHeaderProps) {
  return (
    <header className="sticky top-0 z-10 bg-[var(--app-secondary)] text-white p-4 border-b-4 border-black shadow-[0px_4px_0px_0px_rgba(0,0,0,1)] max-w-md mx-auto w-full">
      <div className="flex items-center justify-between">
        <h1
          className="text-2xl font-black tracking-tighter cursor-pointer hover:underline"
          onClick={onInfoClick}
        >
          BLOCKRUNNERS
        </h1>

        <div className="flex items-center gap-2">
          <Button
            onClick={onBuyCiphersClick}
            className="flex items-center gap-1 h-10 bg-[var(--app-primary)] hover:bg-[var(--app-primary)]/90 text-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all"
          >
            <div className="flex items-center bg-black text-white px-2 py-1 rounded-md border border-[var(--app-primary)]">
              <Zap className="w-4 h-4 mr-1" />
              <span className="font-bold">{ciphers}</span>
            </div>
            <CircleDollarSign className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
