"use client";

import { useCallback, useEffect, useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { createX402Client } from "@payai/x402-solana/client";
import { PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddress, getAccount } from "@solana/spl-token";

import { Spinner } from "./Spinner";
import "./styles.css";
import "@solana/wallet-adapter-react-ui/styles.css";
import "./PaywallAppSolana.css";

// USDC Mint addresses
const USDC_MINT_DEVNET = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";
const USDC_MINT_MAINNET = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

// Type definitions for the paywall configuration
interface PaywallConfig {
  amount: number;
  testnet: boolean;
  currentUrl: string;
  appName?: string;
  appLogo?: string;
}

interface PaywallAppSolanaProps {
  config: PaywallConfig;
  onPaymentComplete?: (response: Response) => void;
  onPaymentError?: (error: Error) => void;
  bodyData?: any;
}

/**
 * Solana Paywall App Component
 * Uses x402-solana package for Solana payments
 *
 * @returns The PaywallAppSolana component
 */
export function PaywallAppSolana({
  config,
  onPaymentComplete,
  onPaymentError,
  bodyData,
}: PaywallAppSolanaProps) {
  const { publicKey, signTransaction, connected } = useWallet();
  const { connection } = useConnection();

  const [status, setStatus] = useState<string>("");
  const [isPaying, setIsPaying] = useState(false);
  const [usdcBalance, setUsdcBalance] = useState<string>("");
  const [hideBalance, setHideBalance] = useState(true);

  const amount = config.amount || 0;
  const network = config.testnet ? "solana-devnet" : "solana";
  const networkName = config.testnet ? "Solana Devnet" : "Solana Mainnet";

  useEffect(() => {
    if (connected && publicKey) {
      checkUSDCBalance();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, publicKey]);

  const checkUSDCBalance = useCallback(async () => {
    if (!publicKey) {
      return;
    }

    try {
      const usdcMintAddress = config.testnet ? USDC_MINT_DEVNET : USDC_MINT_MAINNET;
      const usdcMint = new PublicKey(usdcMintAddress);
      const tokenAddress = await getAssociatedTokenAddress(usdcMint, publicKey);

      const tokenAccount = await getAccount(connection, tokenAddress);
      const balance = Number(tokenAccount.amount) / 1_000_000; // Convert from micro-units
      setUsdcBalance(balance.toFixed(2));
    } catch (error) {
      console.error("Error fetching USDC balance:", error);
      setUsdcBalance("0.00");
    }
  }, [publicKey, connection]);

  const handleSuccessfulResponse = useCallback(
    async (response: Response) => {
      if (onPaymentComplete) {
        onPaymentComplete(response);
      } else {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("text/html")) {
          document.documentElement.innerHTML = await response.text();
        } else {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          window.location.href = url;
        }
      }
    },
    [onPaymentComplete]
  );

  const handlePayment = useCallback(async () => {
    if (!publicKey || !signTransaction || !config) {
      setStatus("Please connect your wallet");
      return;
    }

    setIsPaying(true);
    setStatus("Initializing payment...");

    try {
      // Create wallet adapter for x402-solana
      const walletAdapter = {
        publicKey: publicKey,
        signTransaction: signTransaction,
      };

      // Create x402 client
      const client = createX402Client({
        wallet: walletAdapter,
        network: network as "solana" | "solana-devnet",
        maxPaymentAmount: BigInt(100_000_000), // Max 100 USDC
      });

      setStatus("Checking USDC balance...");
      const balance = parseFloat(usdcBalance);
      if (balance === 0 || balance < amount) {
        throw new Error(
          `Insufficient balance. You need at least $${amount} USDC on ${networkName}`
        );
      }

      setStatus("Processing payment...");
      const response = await client.fetch(config.currentUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: bodyData?.amount,
          name: bodyData?.name,
          identifier: bodyData?.email,
          message: bodyData?.message,
        }),
      });

      if (response.ok) {
        setStatus("Payment successful!");
        await handleSuccessfulResponse(response);
      } else {
        const errorText = await response.text();
        throw new Error(
          `Payment failed: ${response.status} ${response.statusText} - ${errorText}`
        );
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Payment failed";
      setStatus(errorMessage);
      if (onPaymentError) {
        onPaymentError(
          error instanceof Error ? error : new Error(errorMessage)
        );
      }
    } finally {
      setIsPaying(false);
      await checkUSDCBalance(); // Refresh balance after payment
    }
  }, [
    publicKey,
    signTransaction,
    config,
    amount,
    usdcBalance,
    networkName,
    network,
    bodyData,
    handleSuccessfulResponse,
    onPaymentError,
    checkUSDCBalance,
  ]);

  if (!config) {
    return (
      <div className="container">
        <div className="header">
          <h1 className="title">Payment Required</h1>
          <p className="subtitle">Loading payment details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container gap-8">
      <div className="header">
        <h1 className="title">Payment Required</h1>
        <p>
          To access this content, please pay ${amount} {networkName} USDC.
        </p>
        {config.testnet && (
          <p className="instructions">
            Need Solana Devnet USDC?{" "}
            <a
              href="https://faucet.circle.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Get some <u>here</u>.
            </a>
          </p>
        )}
      </div>

      <div className="content w-full">
        <div className="wallet-connect-wrapper">
          <WalletMultiButton />
        </div>

        {connected && publicKey && (
          <div id="payment-section">
            <div className="payment-details">
              <div className="payment-row">
                <span className="payment-label">Wallet:</span>
                <span className="payment-value">
                  {publicKey.toBase58().slice(0, 6)}...
                  {publicKey.toBase58().slice(-4)}
                </span>
              </div>
              <div className="payment-row">
                <span className="payment-label">Available balance:</span>
                <span className="payment-value">
                  <button
                    className="balance-button"
                    onClick={() => setHideBalance((prev) => !prev)}
                  >
                    {usdcBalance && !hideBalance
                      ? `$${usdcBalance} USDC`
                      : "••••• USDC"}
                  </button>
                </span>
              </div>
              <div className="payment-row">
                <span className="payment-label">Amount:</span>
                <span className="payment-value">${amount} USDC</span>
              </div>
              <div className="payment-row">
                <span className="payment-label">Network:</span>
                <span className="payment-value">{networkName}</span>
              </div>
            </div>

            <div className="cta-container">
              <button
                className="button solana-pay-button"
                onClick={handlePayment}
                disabled={isPaying}
              >
                {isPaying ? <Spinner /> : "Pay now"}
              </button>
            </div>
          </div>
        )}
        {status && <div className="status">{status}</div>}
      </div>
    </div>
  );
}

