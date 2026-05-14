'use client';
/**
 * MiniPayContext
 *
 * Exposes the MiniPay-injected wallet address via wagmi's useAccount.
 * Also detects window.ethereum.isMiniPay so UI can adapt accordingly.
 *
 * Usage:
 *   const { user, isConnected, isMiniPay } = useMiniPay();
 */
import { createContext, useContext, useEffect, useState } from 'react';
import { useAccount } from 'wagmi';

type MiniPayUser = {
  address: string;
};

type MiniPayContextType = {
  user: MiniPayUser | null;
  isConnected: boolean;
  isMiniPay: boolean;
};

const MiniPayContext = createContext<MiniPayContextType | undefined>(undefined);

export function MiniPayProvider({ children }: { children: React.ReactNode }) {
  const { address, isConnected } = useAccount();
  const [isMiniPay, setIsMiniPay] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsMiniPay(!!(window.ethereum as any)?.isMiniPay);
    }
  }, []);

  const user: MiniPayUser | null = isConnected && address ? { address } : null;

  return (
    <MiniPayContext.Provider value={{ user, isConnected, isMiniPay }}>
      {children}
    </MiniPayContext.Provider>
  );
}

export function useMiniPay() {
  const context = useContext(MiniPayContext);
  if (context === undefined) {
    throw new Error('useMiniPay must be used within a MiniPayProvider');
  }
  return context;
}

// ── Legacy aliases so old import sites compile without changes ──────────────
/** @deprecated Use MiniPayProvider */
export const FarcasterAuthProvider = MiniPayProvider;
/** @deprecated Use useMiniPay */
export const useFarcasterAuth = useMiniPay;
