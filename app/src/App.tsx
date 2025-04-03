import GameInterface from "@/components/game-interface";
import { Toaster } from "@/components/ui/toaster";
import { WalletProvider } from "@/components/wallet/wallet-provider";

export default function Home() {
  return (
    <WalletProvider>
      <main className="min-h-screen bg-[#f0f0f0] dark:bg-[#121212] flex flex-col">
        <GameInterface />
        <Toaster />
      </main>
    </WalletProvider>
  );
}
