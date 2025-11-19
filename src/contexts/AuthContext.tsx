'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, signOut, getSession, useSession } from 'next-auth/react';
import { createAppClient, viemConnector } from '@farcaster/auth-client';

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

  // Initialize Farcaster auth client
  const farcasterClient = createAppClient({
    ethereum: viemConnector(),
  });

  // Handle automatic sign-in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = await getSession();
        if (session?.user) {
          setCurrentUser({
            fid: session.user.fid,
            email: session.user.email || undefined,
            name: session.user.name || undefined,
            image: session.user.image || undefined,
            address: session.user.address || undefined,
          });
        } else {
          // No session found, try to sign in automatically
          await handleAutoSignIn();
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Handle auto sign-in with Farcaster
  const handleAutoSignIn = async () => {
    try {
      // This will trigger the Farcaster sign-in flow
      await signIn('farcaster', { redirect: false });
    } catch (error) {
      console.error('Error during auto sign-in:', error);
    }
  };

  // Handle login with Farcaster
  const login = async () => {
    try {
      await signIn('farcaster');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
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
  }

  function resetPassword(email: string) {
    return firebaseSendPasswordResetEmail(auth, email);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    loading,
    login,
    signup,
    logout,
    resetPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
