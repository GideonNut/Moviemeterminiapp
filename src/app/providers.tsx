"use client";

import dynamic from "next/dynamic";
import type { Session } from "next-auth"
import { SessionProvider } from "next-auth/react"
import { MiniPayGate } from "~/components/MiniPayGate";
import { AuthProvider } from "~/contexts/AuthContext";

const WagmiConfig = dynamic(
  () => import("~/components/providers/WagmiProvider").then(mod => ({ default: mod.WagmiConfig })),
  {
    ssr: false,
  }
);

export function Providers({ session, children }: { session: Session | null, children: React.ReactNode }) {
  return (
    <SessionProvider session={session}>
      <WagmiConfig>
        <MiniPayGate>
          <AuthProvider>
            {children}
          </AuthProvider>
        </MiniPayGate>
      </WagmiConfig>
    </SessionProvider>
  );
}
