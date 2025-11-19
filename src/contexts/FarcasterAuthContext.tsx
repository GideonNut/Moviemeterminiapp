'use client';

import { createContext, useContext, useEffect, useState } from 'react';

// Types
type FarcasterUser = {
  fid: number;
  username?: string;
  displayName?: string;
  pfp?: string;
  address?: string;
};

type FarcasterAuthContextType = {
  user: FarcasterUser | null;
  isConnected: boolean;
  isLoading: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
};

const FarcasterAuthContext = createContext<FarcasterAuthContextType | undefined>(undefined);

export function FarcasterAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FarcasterUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [farcasterClient, setFarcasterClient] = useState<any>(null);

  // Initialize the Farcaster client
  useEffect(() => {
    const initClient = async () => {
      try {
        // Dynamically import the Farcaster auth client to avoid SSR issues
        const { createAppClient, viemConnector } = await import('@farcaster/auth-client');
        
        // Create the Farcaster client
        const client = createAppClient({
          ethereum: viemConnector(),
        });
        
        setFarcasterClient(client);
        await checkConnection(client);
      } catch (error) {
        console.error('Error initializing Farcaster client:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initClient();
  }, []);

  const checkConnection = async (client: any) => {
    try {
      // Check if the user is already connected
      const { isAuthenticated, fid } = await client.getAuthStatus();
      
      if (isAuthenticated && fid) {
        // Get user info from the client
        const userInfo = await client.getUser({ fid });
        
        setUser({
          fid,
          username: userInfo?.username,
          displayName: userInfo?.displayName,
          pfp: userInfo?.pfp,
          address: userInfo?.address,
        });
        
        setIsConnected(true);
      }
    } catch (error) {
      console.error('Error checking Farcaster connection:', error);
      setIsConnected(false);
      setUser(null);
    }
  };

  const connect = async (silent = false) => {
    if (!farcasterClient) {
      console.error('Farcaster client not initialized');
      throw new Error('Farcaster client not initialized');
    }
    
    try {
      if (!silent) {
        setIsLoading(true);
      }
      
      console.log('Initiating Farcaster connection...');
      
      // This will open the wallet connection prompt if not in silent mode
      const { fid, address } = silent 
        ? await farcasterClient.signInSilently()
        : await farcasterClient.authenticate();
      
      if (fid) {
        console.log('Farcaster connection successful, fetching user info...');
        
        // Get user info
        let userInfo;
        try {
          userInfo = await farcasterClient.getUser({ fid });
          console.log('Fetched user info:', userInfo);
        } catch (error) {
          console.warn('Could not fetch full user info, proceeding with basic info');
          userInfo = {};
        }
        
        const userData = {
          fid,
          username: userInfo?.username || `user_${fid}`,
          displayName: userInfo?.displayName || `User ${fid}`,
          pfp: userInfo?.pfp,
          address: address || userInfo?.address,
        };
        
        console.log('Setting user data:', userData);
        setUser(userData);
        setIsConnected(true);
        
        return userData;
      }
      
      throw new Error('No FID returned from Farcaster');
    } catch (error) {
      console.error('Error connecting to Farcaster:', error);
      
      // If silent mode fails, don't throw the error to allow for retries
      if (silent) {
        console.log('Silent connection failed, will retry...');
        return null;
      }
      
      throw error;
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  };

  const disconnect = () => {
    setUser(null);
    setIsConnected(false);
    // You might want to add additional cleanup here
  };

  return (
    <FarcasterAuthContext.Provider
      value={{
        user,
        isConnected,
        isLoading,
        connect,
        disconnect,
      }}
    >
      {children}
    </FarcasterAuthContext.Provider>
  );
}

export const useFarcasterAuth = () => {
  const context = useContext(FarcasterAuthContext);
  if (context === undefined) {
    throw new Error('useFarcasterAuth must be used within a FarcasterAuthProvider');
  }
  return context;
};
