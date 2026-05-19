'use client';

/**
 * AuthContext — MiniPay edition
 *
 * Identity = Celo wallet address injected by MiniPay (window.ethereum).
 * When wagmi connects (auto-connect fires on mount) we immediately create a
 * NextAuth session via the CredentialsProvider so the server can read
 * `session.user.address` in any API route or server component.
 *
 * No Farcaster, no Firebase Auth — wallet address IS the identity.
 */
import { createContext, useContext, useEffect, useState } from 'react';
import { signIn, signOut, useSession } from 'next-auth/react';
import { useAccount } from 'wagmi';

type User = {
  address: string;
  name?: string;
  image?: string;
};

type AuthContextType = {
  currentUser: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { address, isConnected } = useAccount();
  const { data: session, status } = useSession();
  const [signingIn, setSigningIn] = useState(false);

  // As soon as MiniPay auto-connects the wallet, create a NextAuth session.
  // Runs once per page load (or when address changes).
  useEffect(() => {
    if (isConnected && address && status === 'unauthenticated' && !signingIn) {
      setSigningIn(true);
      signIn('credentials', {
        address: address.toLowerCase(),
        redirect: false,
      }).finally(() => setSigningIn(false));
    }
  }, [isConnected, address, status, signingIn]);

  const logout = async () => {
    await signOut({ redirect: false });
  };

  const loading = status === 'loading' || signingIn;

  const currentUser: User | null =
    session?.user?.address
      ? {
          address: session.user.address,
          name: session.user.name ?? undefined,
          image: session.user.image ?? undefined,
        }
      : null;

  return (
    <AuthContext.Provider
      value={{ currentUser, loading, isAuthenticated: !!currentUser, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}
