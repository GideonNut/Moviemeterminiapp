'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, signOut, getSession, useSession } from 'next-auth/react';
import { createAppClient } from '@farcaster/auth-client';
import { 
  sendPasswordResetEmail as firebaseSendPasswordResetEmail, 
  onAuthStateChanged, 
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  Auth
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

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
  resetPassword: (email: string) => Promise<void>;
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

  // Initialize Farcaster auth client with a minimal mock implementation
  // This is just to satisfy the type requirements since we're using NextAuth
  const farcasterClient = createAppClient({
    ethereum: new Proxy({}, {
      get: () => () => {}
    }) as any
  });

  // Handle automatic sign-in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = await getSession();
        if (session?.user) {
          // Type assertion for session.user to include fid and address
          const user = session.user as any;
          setCurrentUser({
            fid: user.fid || 0,
            email: user.email || undefined,
            name: user.name || undefined,
            image: user.image || undefined,
            address: user.address || undefined,
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

  const login = useCallback(async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth as Auth, email, password);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }, []);

  const signup = useCallback(async (email: string, password: string) => {
    try {
      await createUserWithEmailAndPassword(auth as Auth, email, password);
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await signOut({ redirect: false });
      setCurrentUser(null);
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }, [router]);

  const resetPassword = useCallback(async (email: string) => {
    try {
      await firebaseSendPasswordResetEmail(auth as any, email);
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw error;
    }
  }, []);

  // Handle Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth as Auth, (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        // Map Firebase user to our User type
        setCurrentUser({
          fid: parseInt(firebaseUser.uid) || 0,
          email: firebaseUser.email || undefined,
          name: firebaseUser.displayName || undefined,
          image: firebaseUser.photoURL || undefined
        });
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const value: AuthContextType = {
    currentUser,
    loading,
    login: async () => {
      try {
        await signIn('farcaster');
      } catch (error) {
        console.error('Login error:', error);
        throw error;
      }
    },
    logout: async () => {
      try {
        await signOut();
        setCurrentUser(null);
      } catch (error) {
        console.error('Logout error:', error);
        throw error;
      }
    },
    resetPassword,
    isAuthenticated: !!currentUser
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
