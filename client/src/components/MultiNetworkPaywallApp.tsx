import React, { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { PaywallApp } from "./PaywallApp";
import { PaywallAppSolana } from "./PaywallAppSolana";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { ConnectWallet, Wallet } from "@coinbase/onchainkit/wallet";
import "./styles.css";
import "./PaywallAppSolana.css";

type NetworkType = "evm" | "solana";

interface MultiNetworkPaywallConfig {
  amount: number;
  testnet: boolean; // For EVM network
  solanaTestnet?: boolean; // For Solana network (defaults to testnet if not provided)
  appName?: string;
  appLogo?: string;

  // EVM config
  paymentRequirements?: any;
  currentUrl?: string;
  cdpClientKey?: string;
  sessionTokenEndpoint?: string;

  // Solana config
  solanaUrl?: string;
}

interface MultiNetworkPaywallAppProps {
  config: MultiNetworkPaywallConfig;
  onPaymentComplete?: (response: Response) => void;
  onPaymentError?: (error: Error) => void;
  bodyData?: any;
}

/**
 * Multi-Network Paywall App
 * Automatically detects connected wallets and shows appropriate paywall
 * Defaults to Solana when no wallet is connected
 */
export function MultiNetworkPaywallApp({
  config,
  onPaymentComplete,
  onPaymentError,
  bodyData,
}: MultiNetworkPaywallAppProps) {
  const { isConnected: evmConnected } = useAccount();
  const { connected: solanaConnected, publicKey } = useWallet();
  const { connection } = useConnection();

  // Auto-detect network, default to Solana
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkType>("solana");
  const [solanaNetworkCorrect, setSolanaNetworkCorrect] = useState<boolean>(true);

  // Check if Solana wallet is on correct network
  useEffect(() => {
    const checkSolanaNetwork = async () => {
      if (!solanaConnected || !publicKey) {
        setSolanaNetworkCorrect(true);
        return;
      }

      try {
        const genesisHash = await connection.getGenesisHash();

        // Devnet genesis hash
        const devnetHash = "EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG";
        // Mainnet genesis hash
        const mainnetHash = "5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d";

        const isDevnet = genesisHash === devnetHash;
        const isMainnet = genesisHash === mainnetHash;

        // Check if network matches config (use solanaTestnet if provided, otherwise fall back to testnet)
        const expectedSolanaTestnet = config.solanaTestnet !== undefined ? config.solanaTestnet : config.testnet;
        if (expectedSolanaTestnet) {
          setSolanaNetworkCorrect(isDevnet);
        } else {
          setSolanaNetworkCorrect(isMainnet);
        }
      } catch (error) {
        console.error("Error checking Solana network:", error);
        setSolanaNetworkCorrect(true); // Default to true if check fails
      }
    };

    checkSolanaNetwork();
  }, [solanaConnected, publicKey, connection, config.testnet, config.solanaTestnet]);

  // Auto-detect based on wallet connection
  useEffect(() => {
    if (solanaConnected && !evmConnected) {
      setSelectedNetwork("solana");
    } else if (evmConnected && !solanaConnected) {
      setSelectedNetwork("evm");
    }
    // If both connected, keep current selection
    // If neither connected, default to solana (already set)
  }, [evmConnected, solanaConnected]);

  const evmAvailable = Boolean(config.currentUrl && config.paymentRequirements);
  const solanaAvailable = Boolean(config.solanaUrl);

  // Show network selector if both wallets are connected or if neither is connected
  const showNetworkSelector =
    (evmConnected && solanaConnected) || (!evmConnected && !solanaConnected);

  const expectedSolanaTestnet = config.solanaTestnet !== undefined ? config.solanaTestnet : config.testnet;
  const expectedNetwork = expectedSolanaTestnet ? "Devnet" : "Mainnet";

  // Render the appropriate paywall based on selected network and wallet connection
  const renderPaywall = () => {
    if (selectedNetwork === "solana") {
      if (!solanaAvailable) {
        return (
          <div className="container">
            <div className="header">
              <h1 className="title">Payment Required</h1>
              <p className="subtitle">Solana payments are not available for this content.</p>
              {evmAvailable && (
                <button
                  className="button button-primary mt-4"
                  onClick={() => setSelectedNetwork("evm")}
                >
                  Switch to Base Network
                </button>
              )}
            </div>
          </div>
        );
      }

      // Check if Solana wallet is on wrong network
      if (solanaConnected && !solanaNetworkCorrect) {
        return (
          <div className="container">
            <div className="header">
              <h1 className="title">Wrong Solana Network</h1>
              <p className="subtitle">
                Please switch your Solana wallet to <strong>{expectedNetwork}</strong>.
              </p>
              <p className="instructions mt-4">
                Current wallet is not on {expectedNetwork}. Please switch networks in your wallet
                settings.
              </p>
              {evmAvailable && (
                <button
                  className="button button-primary mt-4"
                  onClick={() => setSelectedNetwork("evm")}
                >
                  Or pay with Base Network instead
                </button>
              )}
            </div>
          </div>
        );
      }

      const solanaConfig = {
        amount: config.amount,
        testnet: config.solanaTestnet !== undefined ? config.solanaTestnet : config.testnet,
        currentUrl: config.solanaUrl!,
        appName: config.appName,
        appLogo: config.appLogo,
      };

      return (
        <PaywallAppSolana
          config={solanaConfig}
          onPaymentComplete={onPaymentComplete}
          onPaymentError={onPaymentError}
          bodyData={bodyData}
        />
      );
    } else {
      // EVM
      if (!evmAvailable) {
        return (
          <div className="container">
            <div className="header">
              <h1 className="title">Payment Required</h1>
              <p className="subtitle">Base network payments are not available for this content.</p>
              {solanaAvailable && (
                <button
                  className="button button-primary mt-4"
                  onClick={() => setSelectedNetwork("solana")}
                >
                  Switch to Solana Network
                </button>
              )}
            </div>
          </div>
        );
      }

      const evmConfig = {
        amount: config.amount,
        testnet: config.testnet,
        paymentRequirements: config.paymentRequirements,
        currentUrl: config.currentUrl!,
        cdpClientKey: config.cdpClientKey,
        appName: config.appName,
        appLogo: config.appLogo,
        sessionTokenEndpoint: config.sessionTokenEndpoint,
      };

      return (
        <PaywallApp
          config={evmConfig}
          onPaymentComplete={onPaymentComplete}
          onPaymentError={onPaymentError}
          bodyData={bodyData}
        />
      );
    }
  };

  return (
    <div className="container gap-8">
      {/* Network Selector - only show when both or neither connected */}
      {showNetworkSelector && (evmAvailable || solanaAvailable) && (
        <div className="header">
          <h1 className="title">Choose Payment Network</h1>
          <div className="mb-6">
            <select
              value={selectedNetwork}
              onChange={(e) => setSelectedNetwork(e.target.value as NetworkType)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300 text-base"
            >
              {solanaAvailable && (
                <option value="solana">
                  Solana {config.testnet ? "Devnet" : "Mainnet"} (USDC) - ${config.amount}
                </option>
              )}
              {evmAvailable && (
                <option value="evm">
                  Base {config.testnet ? "Sepolia" : ""} (USDC) - ${config.amount}
                </option>
              )}
            </select>
          </div>

          {/* Connection buttons if no wallet connected */}
          {!evmConnected && !solanaConnected && (
            <div className="flex flex-col gap-3 mb-6">
              {selectedNetwork === "solana" && solanaAvailable && (
                <div className="w-full wallet-connect-wrapper">
                  <p className="text-sm text-gray-600 mb-2">
                    Connect your Solana wallet (switch to {expectedNetwork}):
                  </p>
                  <WalletMultiButton />
                </div>
              )}
              {selectedNetwork === "evm" && evmAvailable && (
                <div className="w-full">
                  <p className="text-sm text-gray-600 mb-2">Connect your EVM wallet:</p>
                  <Wallet className="w-full">
                    <ConnectWallet className="w-full py-3" />
                  </Wallet>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Render the selected paywall */}
      {renderPaywall()}
    </div>
  );
}

