"use client";
/**
 * WalletStatus
 *
 * In production (inside MiniPay) the wallet is auto-connected — no UI needed.
 * In development (NEXT_PUBLIC_MINIPAY_DEV_BYPASS=true) this component renders
 * a small status bar so you can see the connected address during testing.
 *
 * Old export name `FarcasterConnectButton` is kept as an alias so any existing
 * import site continues to work.
 */
import { useAccount } from "wagmi";
import { truncateAddress } from "~/lib/truncateAddress";

const IS_DEV = process.env.NEXT_PUBLIC_MINIPAY_DEV_BYPASS === "true";

export function WalletStatus() {
  const { address, isConnected } = useAccount();

  // In production, show nothing — wallet is implicit in MiniPay
  if (!IS_DEV) return null;

  return (
    <div className="flex items-center gap-2 text-xs text-white/60 border border-white/10 rounded-full px-3 py-1">
      {isConnected && address ? (
        <>
          <span className="w-2 h-2 rounded-full bg-green-400 shrink-0" />
          <span className="font-mono">{truncateAddress(address)}</span>
        </>
      ) : (
        <>
          <span className="w-2 h-2 rounded-full bg-yellow-400 shrink-0" />
          <span>Wallet not connected (dev)</span>
        </>
      )}
    </div>
  );
}

/** @deprecated Use WalletStatus */
export const FarcasterConnectButton = WalletStatus;

