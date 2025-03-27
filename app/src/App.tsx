import GameInterface from "@/components/game-interface";
import { Toaster } from "@/components/ui/toaster";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f0f0f0] dark:bg-[#121212] flex flex-col">
      <GameInterface />
      <Toaster />
    </main>
  );
}
