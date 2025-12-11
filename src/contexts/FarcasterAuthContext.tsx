'use client';

import { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { useConnect, useAccount, useDisconnect } from 'wagmi';
import { farcasterFrame } from '@farcaster/frame-wagmi-connector';

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
  const { connect: wagmiConnect, connectors, isPending: isConnecting } = useConnect();
  const { address, isConnected: wagmiConnected, connector } = useAccount();
  const { disconnect: wagmiDisconnect } = useDisconnect();
  const [user, setUser] = useState<FarcasterUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Find the Farcaster connector
  const farcasterConnector = useMemo(() => {
    return connectors.find(c => 
      c.id === 'farcasterFrame' || 
      c.name === 'Farcaster' ||
      c.type === 'farcasterFrame'
    );
  }, [connectors]);

  // Check if connected via Farcaster
  const isConnected = wagmiConnected && (
    connector?.id === 'farcasterFrame' || 
    connector?.name === 'Farcaster'
  );

  // Fetch Farcaster user info when connected
  useEffect(() => {
    const fetchUserInfo = async () => {
      if (!isConnected || !address) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        
        // Import the lookup function
        const { lookupFidByCustodyAddress, getFarcasterUser } = await import('~/lib/farcaster');
        
        // Lookup FID from the custody address
        const fid = await lookupFidByCustodyAddress(address);
        
        if (fid) {
          // Fetch full user info from Farcaster API
          try {
            const userData = await getFarcasterUser(fid);
            
            if (userData) {
              setUser({
                fid,
                username: userData.username,
                displayName: userData.displayName,
                pfp: userData.pfp,
                address: address,
              });
            } else {
              // Fallback: use FID and address if API call fails
              setUser({
                fid,
                address: address,
                username: `user_${fid}`,
                displayName: `User ${fid}`,
              });
            }
          } catch (error) {
            console.warn('Could not fetch user info from Farcaster API:', error);
            // Fallback: use FID and address
            setUser({
              fid,
              address: address,
              username: `user_${fid}`,
              displayName: `User ${fid}`,
            });
          }
        } else {
          // No FID found for this address, use address only
          console.warn('Could not lookup FID for address:', address);
          setUser({
            fid: 0, // Placeholder
            address: address,
          });
        }
      } catch (error) {
        console.error('Error fetching Farcaster user info:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserInfo();
  }, [isConnected, address]);

  const connect = async () => {
    if (!farcasterConnector) {
      throw new Error('Farcaster connector not available');
    }

    try {
      setIsLoading(true);
      await wagmiConnect({ connector: farcasterConnector });
    } catch (error) {
      console.error('Error connecting to Farcaster:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const disconnect = () => {
    wagmiDisconnect();
    setUser(null);
  };

  const isLoadingState = isLoading || isConnecting;

  return (
    <FarcasterAuthContext.Provider
      value={{
        user,
        isConnected,
        isLoading: isLoadingState,
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
