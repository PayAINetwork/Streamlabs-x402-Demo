import React, { useMemo } from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { clusterApiUrl } from "@solana/web3.js";

interface SolanaProvidersProps {
  children: React.ReactNode;
  network?: WalletAdapterNetwork;
}

/**
 * Solana Wallet Providers
 * Wraps app with necessary Solana wallet adapters
 */
export function SolanaProviders({
  children,
  network = WalletAdapterNetwork.Devnet,
}: SolanaProvidersProps) {
  // RPC endpoint - using Helius for reliable mainnet access
  const endpoint = useMemo(() => {
    if (network === WalletAdapterNetwork.Mainnet) {
      const heliusKey = process.env.REACT_APP_HELIUS_API_KEY;
      if (heliusKey) {
        return `https://mainnet.helius-rpc.com/?api-key=${heliusKey}`;
      }
    }
    return clusterApiUrl(network);
  }, [network]);

  // Wallet adapters
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter({ network }),
    ],
    [network]
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

