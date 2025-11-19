import { createAppClient, viemConnector } from '@farcaster/auth-client';

export const farcasterClient = createAppClient({
  ethereum: viemConnector(),
});

export async function connectWallet() {
  try {
    // This will open the wallet connection prompt
    const { fid, address } = await farcasterClient.authenticate();
    
    if (!fid || !address) {
      throw new Error('Failed to connect to Farcaster wallet');
    }

    // Return the user's FID and address
    return { fid, address };
  } catch (error) {
    console.error('Error connecting to Farcaster wallet:', error);
    throw error;
  }
}

export async function getCurrentUser() {
  try {
    const { isAuthenticated, fid } = await farcasterClient.getAuthenticationStatus();
    
    if (!isAuthenticated || !fid) {
      return null;
    }

    // Get additional user info if needed
    const userInfo = await farcasterClient.lookupUserByFid({ fid });
    
    return {
      fid,
      username: userInfo?.username,
      displayName: userInfo?.displayName,
      pfp: userInfo?.pfp,
      // Add other user info as needed
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}
