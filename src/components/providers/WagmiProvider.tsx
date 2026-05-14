"use client";

import { createConfig, http, WagmiProvider } from "wagmi";
import { celo, celoSepolia } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { injected, walletConnect } from 'wagmi/connectors';
import { useEffect, useState } from "react";
import { useConnect, useAccount } from "wagmi";
import React from "react";

// ─── Wagmi config ─────────────────────────────────────────────────────────────
// MiniPay only supports Celo Mainnet (42220) and Celo Sepolia (11142220).
// Imported directly from wagmi/chains so RPC URLs and chain metadata are
// always correct. Ref: https://docs.minipay.xyz/getting-started/project-setup.html

const queryClient = new QueryClient();

export const config = createConfig({
  chains: [celoSepolia, celo],
  connectors: [
    injected(),   // MiniPay / any window.ethereum (in-app browser)
    walletConnect({ projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID! }), // WalletConnect v2 QR modal
  ],
  transports: {
    [celo.id]: http(),
    [celoSepolia.id]: http(),
  },
  ssr: true,
});

// ─── Auto-connect hook ────────────────────────────────────────────────────────
// MiniPay requires auto-connect on page load. Never show a "Connect wallet"
// button. Pattern follows: https://docs.minipay.xyz/getting-started/wallet-connection.html
function useAutoConnect() {
  const { connect, connectors: availableConnectors, error: connectError } = useConnect();
  const { isConnected } = useAccount();
  const [hasAttempted, setHasAttempted] = useState(false);

  useEffect(() => {
    if (hasAttempted || isConnected || availableConnectors.length === 0) return;

    const attemptConnect = async () => {
      try {
        // Use the first available connector (injected = MiniPay's window.ethereum)
        await connect({ connector: availableConnectors[0] });
      } catch (err) {
        console.error("Auto-connect failed:", err);
      }
      setHasAttempted(true);
    };

    attemptConnect();
  }, [availableConnectors, connect, hasAttempted, isConnected]);

  return { error: connectError };
}

// Wrapper component that provides auto-connection
function AutoConnect({ children }: { children: React.ReactNode }) {
  useAutoConnect();
  return <>{children}</>;
}

export function WagmiConfig({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return null;
  }

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <AutoConnect>
          {children}
        </AutoConnect>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
