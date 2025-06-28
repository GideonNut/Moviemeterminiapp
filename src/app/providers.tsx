"use client";

import dynamic from "next/dynamic";
import type { Session } from "next-auth"
import { SessionProvider } from "next-auth/react"
import { FrameProvider } from "~/components/providers/FrameProvider";

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
        <FrameProvider>
          {children}
        </FrameProvider>
      </WagmiConfig>
    </SessionProvider>
  );
}
