"use client";

import { createConfig, http, WagmiProvider } from "wagmi";
import { base, degen, mainnet, optimism, unichain } from "wagmi/chains";
import type { Chain } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { farcasterFrame } from "@farcaster/frame-wagmi-connector";
import { coinbaseWallet, metaMask, injected } from 'wagmi/connectors';
import { APP_NAME, APP_ICON_URL, APP_URL } from "~/lib/constants";
import { useEffect, useState } from "react";
import { useConnect, useAccount } from "wagmi";
import React from "react";

// Define Celo chain
const celoChain: Chain = {
  id: 42220,
  name: "Celo",
  nativeCurrency: {
    name: "Celo",
    symbol: "CELO",
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ["https://forno.celo.org"] },
    public: { http: ["https://forno.celo.org"] },
  },
  blockExplorers: {
    default: { name: "CeloScan", url: "https://celoscan.io" },
  },
};

const queryClient = new QueryClient();

// Create transport configurations with dynamic RPC URLs
const transports = {
  [celoChain.id]: http(celoChain.rpcUrls.default.http[0]),
  [base.id]: http(base.rpcUrls.default.http[0]),
  [optimism.id]: http(optimism.rpcUrls.default.http[0]),
  [degen.id]: http(degen.rpcUrls.default.http[0]),
  [unichain.id]: http(unichain.rpcUrls.default.http[0]),
};

export const config = createConfig({
  chains: [celoChain, base, optimism, degen, unichain],
  transports,
  connectors: [
    farcasterFrame(),
    metaMask(),
    coinbaseWallet({
      appName: APP_NAME,
      appLogoUrl: APP_ICON_URL,
    }),
    injected({
      target: 'metaMask',
    }),
  ],
});

// Custom hook for auto-connecting to Warpcast
function useAutoConnect() {
  const { connect, connectors } = useConnect();
  const { isConnected } = useAccount();

  useEffect(() => {
    const autoConnect = async () => {
      if (!isConnected && connectors?.[0]) {
        try {
          await connect({ connector: connectors[0] });
        } catch (error) {
          console.error("Error auto-connecting to Warpcast:", error);
        }
      }
    };

    autoConnect();
  }, [isConnected, connect, connectors]);
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
