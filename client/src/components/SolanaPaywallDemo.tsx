import React, { useState, useMemo } from "react";
import { X402Paywall } from "@payai/x402-solana-react";
import { ConnectionProvider, WalletProvider, useWallet } from "@solana/wallet-adapter-react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import "@payai/x402-solana-react/dist/style.css";
import "@solana/wallet-adapter-react-ui/styles.css";

const HELIUS_API_KEY = process.env.REACT_APP_HELIUS_API_KEY;
const HELIUS_RPC_URL = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;

function PaywallContent() {
  const { publicKey, signTransaction } = useWallet();
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);

  const dollarAmounts: number[] = [1, 5, 10];

  const walletAdapter = useMemo(() => {
    if (!publicKey || !signTransaction) return null;
    return {
      publicKey,
      signTransaction,
    };
  }, [publicKey, signTransaction]);

  if (showPaywall && selectedAmount && walletAdapter) {
    return (
      <X402Paywall
        amount={selectedAmount}
        description="Premium Demo Content Access"
        wallet={walletAdapter}
        network="solana"
        rpcUrl={HELIUS_RPC_URL}
        showBalance={true}
        showNetworkInfo={true}
        onPaymentSuccess={(txId: string) => {
          console.log('Payment successful!', txId);
          setShowPaywall(false);
          setSelectedAmount(null);
        }}
        onPaymentError={(error: Error) => {
          console.error('Payment failed:', error);
          setShowPaywall(false);
        }}
      >
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white shadow-2xl rounded-3xl overflow-hidden">
            <div className="text-center p-10">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                🎉 Payment Successful!
              </h1>
              <p className="text-lg text-slate-600 mt-4">
                You've successfully unlocked exclusive content
              </p>
              <button
                onClick={() => {
                  setShowPaywall(false);
                  setSelectedAmount(null);
                }}
                className="mt-6 bg-gradient-to-r from-purple-500 to-pink-600 text-white px-8 py-3 rounded-full font-semibold hover:shadow-lg transition-all"
              >
                Back to Demo
              </button>
            </div>
          </div>
        </div>
      </X402Paywall>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 via-pink-600 to-purple-700 p-5">
        <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden">
          <header
            className="text-white p-10 text-center relative"
            style={{
              background: "linear-gradient(to right, #9333ea, #db2777)",
            }}
          >
            <div className="relative z-10">
              <h1 className="text-4xl font-bold mb-3">
                Solana x402 Payment Demo
              </h1>
              <p className="text-xl opacity-90">
                Test the x402-solana payment integration
              </p>
            </div>
          </header>

          <div className="p-10">
            <div className="mb-8 text-center">
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-3">
                  🧪 Testing Instructions
                </h3>
                <div className="text-left space-y-2 text-sm text-blue-800">
                  <p>1. Make sure you have a Solana wallet (Phantom/Solflare)</p>
                  <p>2. Make sure you have USDC in your wallet</p>
                  <p>3. Select an amount and proceed with payment</p>
                  <p>4. Test payments are automatically refunded</p>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-800 text-center mb-6">
                Select Amount:
              </h3>
              <div className="grid grid-cols-3 gap-4">
                {dollarAmounts.map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    className={`py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${
                      selectedAmount === amount
                        ? "bg-purple-600 text-white shadow-lg shadow-purple-500/50"
                        : "bg-white text-gray-700 border-2 border-gray-200 hover:border-purple-400 hover:bg-purple-50"
                    }`}
                    onClick={() => setSelectedAmount(amount)}
                  >
                    ${amount}
                  </button>
                ))}
              </div>
            </div>

            {!publicKey ? (
              <div className="text-center">
                <p className="text-gray-600 mb-4">Connect your wallet to continue</p>
                <WalletMultiButton className="!bg-gradient-to-r !from-purple-500 !to-pink-600 !text-white !px-10 !py-4 !rounded-full !text-xl !font-semibold !shadow-lg !shadow-purple-500/30 hover:!shadow-xl hover:!shadow-purple-500/40 !transform hover:!-translate-y-1 !transition-all !duration-300 !border-0" />
              </div>
            ) : selectedAmount ? (
              <div className="text-center">
                <button
                  type="button"
                  className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-10 py-4 rounded-full text-xl font-semibold shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 transform hover:-translate-y-1 transition-all duration-300"
                  onClick={() => setShowPaywall(true)}
                >
                  Pay ${selectedAmount}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
  );
}

export function SolanaPaywallDemo() {
  const endpoint = useMemo(() => HELIUS_RPC_URL, []);

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <PaywallContent />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

