'use client';
/**
 * MiniPayContext  (replaces FarcasterAuthContext)
 *
 * In MiniPay the wallet is injected automatically — there is no Farcaster
 * frame or FID. This context simply exposes the wagmi-connected address and
 * a flag that tells the UI whether we are running inside MiniPay.
 *
 * The legacy `FarcasterAuthProvider` and `useFarcasterAuth` exports are kept
 * as thin aliases so existing import sites continue to compile unchanged.
 */
import { createContext, useContext, useEffect, useState } from 'react';
import { useAccount } from 'wagmi';

type MiniPayUser = {
  address: string;
};

type MiniPayContextType = {
  user: MiniPayUser | null;
  isConnected: boolean;
  isLoading: boolean;
  isMiniPay: boolean;
  /** no-op — wagmi auto-connects in MiniPay */
  connect: () => Promise<void>;
  /** no-op */
  disconnect: () => void;
};

const MiniPayContext = createContext<MiniPayContextType | undefined>(undefined);

export function FarcasterAuthProvider({ children }: { children: React.ReactNode }) {
  const { address, isConnected } = useAccount();
  const [isMiniPay, setIsMiniPay] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsMiniPay(!!(window.ethereum as any)?.isMiniPay);
    }
  }, []);

  const user: MiniPayUser | null = isConnected && address ? { address } : null;

  return (
    <MiniPayContext.Provider
      value={{
        user,
        isConnected,
        isLoading: false,
        isMiniPay,
        connect: async () => {},   // wagmi auto-connects
        disconnect: () => {},
      }}
    >
      {children}
    </MiniPayContext.Provider>
  );
}

export const useFarcasterAuth = () => {
  const context = useContext(MiniPayContext);
  if (context === undefined) {
    throw new Error('useFarcasterAuth must be used within a FarcasterAuthProvider');
  }
  return context;
};
