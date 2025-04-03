import GameInterface from "@/components/game-interface";
import { Toaster } from "@/components/ui/toaster";
import { WalletProvider } from "@/components/wallet/wallet-provider";
import { GameInitializer } from "@/components/game-initializer";
import { Web3Status } from "@/components/web3-status";

export default function Home() {
  return (
    <WalletProvider>
      <main className="min-h-screen bg-[#f0f0f0] dark:bg-[#121212] flex flex-col">
        <GameInitializer />
        <GameInterface />
        <Web3Status />
        <Toaster />
      </main>
    </WalletProvider>
  );
}
