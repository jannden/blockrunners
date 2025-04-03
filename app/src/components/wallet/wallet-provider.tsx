import { FC, ReactNode, useEffect, useMemo } from "react";
import {
  ConnectionProvider,
  WalletProvider as SolanaWalletProvider,
  useWallet,
} from "@solana/wallet-adapter-react";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  CoinbaseWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { useWalletStore } from "@/lib/wallet-store";

// Default styles for wallet adapter
import "@solana/wallet-adapter-react-ui/styles.css";

interface Props {
  children: ReactNode;
}

// This component listens to wallet events and updates the Zustand store
const WalletListener: FC = () => {
  const { publicKey, connected } = useWallet();
  const { setConnected, setPublicKey, disconnect } = useWalletStore();

  useEffect(() => {
    setConnected(connected);
    if (publicKey) {
      setPublicKey(publicKey);
    } else if (!connected) {
      disconnect();
    }
  }, [connected, publicKey, setConnected, setPublicKey, disconnect]);

  return null;
};

export const WalletProvider: FC<Props> = ({ children }) => {
  // Get network RPC URL from environment variables=
  const rpcUrl = import.meta.env.VITE_SOLANA_RPC_URL || "http://127.0.0.1:8899";
  const endpoint = useMemo(() => rpcUrl, [rpcUrl]);
  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter(), new CoinbaseWalletAdapter()],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <SolanaWalletProvider wallets={wallets} autoConnect onError={(error) => console.error(error)}>
        <WalletModalProvider>
          <WalletListener />
          {children}
        </WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
};
