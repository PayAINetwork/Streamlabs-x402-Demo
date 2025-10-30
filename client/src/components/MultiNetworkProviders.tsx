import React from "react";
import { Providers } from "./Providers";
import { SolanaProviders } from "./SolanaProviders";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";

interface MultiNetworkProvidersProps {
  children: React.ReactNode;
  evmConfig: {
    testnet: boolean;
    cdpClientKey?: string;
    appName?: string;
    appLogo?: string;
  };
  solanaNetwork?: WalletAdapterNetwork;
}

/**
 * Multi-Network Providers
 * Wraps children with both EVM and Solana wallet providers
 */
export function MultiNetworkProviders({
  children,
  evmConfig,
  solanaNetwork = WalletAdapterNetwork.Devnet,
}: MultiNetworkProvidersProps) {
  return (
    <Providers config={evmConfig}>
      <SolanaProviders network={solanaNetwork}>
        {children}
      </SolanaProviders>
    </Providers>
  );
}

