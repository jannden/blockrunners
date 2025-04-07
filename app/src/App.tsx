import ConnectionWalletProvider from "./context/ConnectionWalletProvider";
import BlockrunnersProvider from "./context/BlockrunnersProvider";
import BalanceProvider from "./context/BalanceProvider";
import { Toaster } from "./components/ui/toaster";
import { GameInterface } from "./components/game-interface";

function App() {
  return (
    <ConnectionWalletProvider>
      {/* <SessionProvider> */}
      <BalanceProvider>
        <BlockrunnersProvider>
          <GameInterface />
          <Toaster />
        </BlockrunnersProvider>
      </BalanceProvider>
      {/* </SessionProvider> */}
    </ConnectionWalletProvider>
  );
}

export default App;
