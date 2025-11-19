"use client";

import { WagmiConfig } from "./WagmiProvider";
import { SessionProvider } from "next-auth/react";
import { FarcasterAuthProvider } from "@/contexts/FarcasterAuthContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiConfig>
      <SessionProvider>
        <FarcasterAuthProvider>
          {children}
        </FarcasterAuthProvider>
      </SessionProvider>
    </WagmiConfig>
  );
}