'use client';

import { useEffect, useState } from 'react';
import { useFarcasterAuth } from '@/contexts/FarcasterAuthContext';

export function AutoConnectFarcaster() {
  const { user, isConnected, isLoading, connect } = useFarcasterAuth();
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
    const attemptConnection = async () => {
      if (isConnected || isLoading) return;
      
      setIsConnecting(true);
      setConnectionError(null);
      
      try {
        console.log('Attempting to connect to Farcaster...');
        await connect();
        console.log('Successfully connected to Farcaster');
      } catch (error) {
        console.error('Failed to connect to Farcaster:', error);
        setConnectionError('Failed to connect to Farcaster. Please try again.');
        
        // Auto-retry after 5 seconds
        setTimeout(() => {
          if (!isConnected) {
            console.log('Retrying Farcaster connection...');
            attemptConnection();
          }
        }, 5000);
      } finally {
        setIsConnecting(false);
      }
    };

    // Initial connection attempt
    attemptConnection();

    // Set up a periodic check in case the connection drops
    const connectionCheckInterval = setInterval(() => {
      if (!isConnected && !isLoading && !isConnecting) {
        console.log('Periodic Farcaster connection check...');
        attemptConnection();
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(connectionCheckInterval);
  }, [isConnected, isLoading, connect]);

  // Show loading state while connecting
  if (isConnecting) {
    return (
      <div className="fixed bottom-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg">
        Connecting to Farcaster...
      </div>
    );
  }

  // Show error message if connection failed
  if (connectionError && !isConnected) {
    return (
      <div 
        className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg cursor-pointer hover:bg-red-600 transition-colors"
        onClick={async () => {
          setConnectionError(null);
          await connect().catch(console.error);
        }}
      >
        {connectionError} (Click to retry)
      </div>
    );
  }

  return null;
}
