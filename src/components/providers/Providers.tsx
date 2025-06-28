"use client";

import { WagmiConfig } from "./WagmiProvider";
import { SessionProvider } from "next-auth/react";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiConfig>
      <SessionProvider>
        {children}
      </SessionProvider>
    </WagmiConfig>
  );
} 