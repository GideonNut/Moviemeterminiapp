'use client';
/**
 * MiniPayAutoConnect
 *
 * MiniPay injects window.ethereum and wagmi's injected() connector picks it up
 * automatically on mount — no manual action required.
 *
 * This component is intentionally a no-op in production. In development
 * (NEXT_PUBLIC_MINIPAY_DEV_BYPASS=true) it shows a small toast if wagmi
 * hasn't connected within 3 seconds, which helps catch config issues early.
 *
 * Old export `AutoConnectFarcaster` is kept as an alias.
 */
import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';

const IS_DEV = process.env.NEXT_PUBLIC_MINIPAY_DEV_BYPASS === 'true';

export function MiniPayAutoConnect() {
  const { isConnected } = useAccount();
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    if (!IS_DEV) return;
    const timer = setTimeout(() => {
      if (!isConnected) setShowWarning(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, [isConnected]);

  useEffect(() => {
    if (isConnected) setShowWarning(false);
  }, [isConnected]);

  if (!IS_DEV || !showWarning) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-yellow-500 text-black px-4 py-2 rounded-lg shadow-lg text-xs font-medium">
      ⚠️ Wallet not connected — is MetaMask/dev wallet active?
    </div>
  );
}

/** @deprecated Use MiniPayAutoConnect */
export const AutoConnectFarcaster = MiniPayAutoConnect;

