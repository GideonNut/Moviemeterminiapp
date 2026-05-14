"use client";
/**
 * FarcasterConnectButton — replaced for MiniPay
 *
 * In MiniPay the wallet is auto-connected; there is no manual connect step.
 * This component now just shows the connected wallet address (truncated).
 * The export name is kept so import sites don't need to change.
 */
import { useAccount } from "wagmi";
import { truncateAddress } from "~/lib/truncateAddress";

export function FarcasterConnectButton() {
  const { address, isConnected } = useAccount();

  if (!isConnected || !address) return null;

  return (
    <div className="flex items-center gap-2 text-sm text-white/80">
      <div className="w-2 h-2 rounded-full bg-green-400" />
      <span className="font-mono">{truncateAddress(address)}</span>
    </div>
  );
}

