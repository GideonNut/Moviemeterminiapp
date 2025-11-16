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

// Define Celo chains
const celoChain: Chain = {
  id: 42220,
  name: "Celo",
  nativeCurrency: {
    name: "Celo",
    symbol: "CELO",
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ["https://1rpc.io/celo"] },
    public: { http: ["https://1rpc.io/celo", "https://forno.celo.org"] },
  },
  blockExplorers: {
    default: { name: "CeloScan", url: "https://celoscan.io" },
  },
};

const celoAlfajoresChain: Chain = {
  id: 44787,
  name: "Celo Alfajores",
  nativeCurrency: {
    name: "Celo",
    symbol: "CELO",
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ["https://alfajores-forno.celo-testnet.org"] },
    public: { http: ["https://alfajores-forno.celo-testnet.org"] },
  },
  blockExplorers: {
    default: { name: "CeloScan", url: "https://alfajores.celoscan.io" },
  },
};

const queryClient = new QueryClient();

// Create transport configurations with dynamic RPC URLs
const transports = {
  [celoChain.id]: http("https://1rpc.io/celo"),
  [celoAlfajoresChain.id]: http("https://alfajores-forno.celo-testnet.org"),
  [base.id]: http(base.rpcUrls.default.http[0]),
  [optimism.id]: http(optimism.rpcUrls.default.http[0]),
  [degen.id]: http(degen.rpcUrls.default.http[0]),
  [unichain.id]: http(unichain.rpcUrls.default.http[0]),
};

// Helper function to check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Function to detect MetaMask or other injected providers
const getConnectors = () => {
  const connectors = [];

  // Add MetaMask connector first if available
  if (isBrowser && (window.ethereum?.isMetaMask || window.ethereum?.providers?.some((p: any) => p.isMetaMask))) {
    connectors.push(
      metaMask({
        dappMetadata: {
          name: APP_NAME,
          url: APP_URL,
          iconUrl: APP_ICON_URL,
        },
        // shimDisconnect is not a valid option for metaMask connector
        // It's automatically handled by wagmi internally
      })
    );
  }

  // Add Coinbase Wallet
  connectors.push(
    coinbaseWallet({
      appName: APP_NAME,
      appLogoUrl: APP_ICON_URL,
    })
  );

  // Add Farcaster Frame
  connectors.push(farcasterFrame());

  // Add generic injected connector as fallback
  if (isBrowser && window.ethereum) {
    connectors.push(
      injected({
        target: 'metaMask',
        // Remove the name as it's not a valid property
      })
    );
  }

  return connectors;
};

export const config = createConfig({
  chains: [celoChain, celoAlfajoresChain, base, optimism, degen, unichain],
  transports,
  connectors: getConnectors(),
  ssr: true, // Enable server-side rendering support
});

// Custom hook for auto-connecting to wallet
function useAutoConnect() {
  const { connect, connectors } = useConnect();
  const { isConnected, isReconnecting } = useAccount();

  useEffect(() => {
    const autoConnect = async () => {
      // Skip if already connected or still reconnecting
      if (isConnected || isReconnecting) return;
      
      // Skip if not in browser or no connectors available
      if (!isBrowser || !connectors?.length) return;

      try {
        console.log('Attempting to auto-connect to wallet...');
        
        // Find the first ready connector that matches MetaMask if available
        const connector = connectors.find(c => 
          c.ready && 
          (c.id === 'metaMask' || c.name === 'MetaMask')
        ) || connectors.find(c => c.ready);
        
        if (connector) {
          console.log(`Auto-connecting with ${connector.name}...`);
          await connect({ connector });
        }
      } catch (error) {
        console.error('Auto-connect error:', error);
      }
    };

    // Add a small delay to ensure window.ethereum is available
    const timer = setTimeout(() => {
      autoConnect();
    }, 500);

    return () => clearTimeout(timer);
  }, [isConnected, isReconnecting, connect, connectors]);
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
