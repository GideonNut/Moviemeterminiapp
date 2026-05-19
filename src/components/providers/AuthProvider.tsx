'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';

type User = {
  fid: number;
  email?: string;
  name?: string;
  image?: string;
  address?: string;
};

type AuthContextType = {
  currentUser: User | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
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
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'loading') return;
    if (session?.user) {
      setCurrentUser({
        fid: session.user.fid,
        email: session.user.email || undefined,
        name: session.user.name || undefined,
        image: session.user.image || undefined,
        address: session.user.address || undefined,
      });
    } else {
      setCurrentUser(null);
    }
    setLoading(false);
  }, [session, status]);

  const login = async () => {
    // Auth is handled by MiniPay wallet connection
  };

  // Handle logout
  const logout = async () => {
    try {
      await signOut({ redirect: false });
      setCurrentUser(null);
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const value = {
    currentUser,
    loading,
    login,
    logout,
    isAuthenticated: !!currentUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
