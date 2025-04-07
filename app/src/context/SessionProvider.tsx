import { FC, ReactNode } from "react";
import { SessionWalletProvider, useSessionKeyManager } from "@magicblock-labs/gum-react-sdk";
import { AnchorWallet, useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { Cluster } from "@solana/web3.js";

const SessionProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const { connection } = useConnection();
  const anchorWallet = useAnchorWallet() as AnchorWallet;

  const cluster: Cluster | "localnet" = import.meta.env.VITE_SOLANA_CLUSTER || "localnet";
  const sessionWallet = useSessionKeyManager(anchorWallet, connection, cluster);

  return <SessionWalletProvider sessionWallet={sessionWallet}>{children}</SessionWalletProvider>;
};

export default SessionProvider;
