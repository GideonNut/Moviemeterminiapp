// Native Farcaster API client - no Neynar dependency
import { APP_URL } from './constants';

export interface FarcasterUser {
  fid: number;
  username: string;
  displayName: string;
  pfp: string;
  followerCount: number;
  followingCount: number;
  verifications: string[];
  bio: {
    text: string;
    mentions: string[];
  };
}

// Use the official Farcaster API
const FARCASTER_API_BASE = 'https://api.farcaster.xyz/v2';

export async function getFarcasterUser(fid: number): Promise<FarcasterUser | null> {
  try {
    const response = await fetch(`${FARCASTER_API_BASE}/users/${fid}`, {
      headers: {
        'accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Error fetching Farcaster user:', response.statusText);
      return null;
    }

    const data = await response.json();
    return data.user;
  } catch (error) {
    console.error('Error getting Farcaster user:', error);
    return null;
  }
}

export async function lookupFidByCustodyAddress(custodyAddress: string): Promise<number | null> {
  try {
    // Use the correct Farcaster API endpoint for looking up users by custody address
    const response = await fetch(
      `${FARCASTER_API_BASE}/users?custody_address=${custodyAddress.toLowerCase()}`,
      {
        headers: {
          'accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error('Error looking up FID:', response.statusText);
      return null;
    }

    const data = await response.json();
    
    // Check if we have users in the response
    if (data.users && Array.isArray(data.users) && data.users.length > 0) {
      return data.users[0].fid;
    }

    // If no users found, try alternative endpoint
    console.log('No users found with primary endpoint, trying alternative...');
    const altResponse = await fetch(
      `${FARCASTER_API_BASE}/user_by_custody_address?custody_address=${custodyAddress.toLowerCase()}`,
      {
        headers: {
          'accept': 'application/json',
        },
      }
    );

    if (altResponse.ok) {
      const altData = await altResponse.json();
      if (altData.user && altData.user.fid) {
        return altData.user.fid;
      }
    }

    throw new Error('No FID found for this custody address');
  } catch (error) {
    console.error('Error looking up FID by custody address:', error);
    throw new Error(`Failed to lookup FID: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function sendFrameNotification({
  fid,
  title,
  body,
}: {
  fid: number;
  title: string;
  body: string;
}): Promise<{ state: 'success' | 'error' | 'rate_limit'; error?: string }> {
  try {
    // For native Farcaster notifications, you would need to implement
    // your own notification system or use a different service
    // This is a placeholder implementation
    
    console.log(`Would send notification to FID ${fid}: ${title} - ${body}`);
    
    // For now, return success but log that this needs implementation
    console.warn('Native Farcaster notifications not yet implemented. Consider using a notification service.');
    
    return { state: 'success' };
  } catch (error) {
    console.error('Error sending frame notification:', error);
    return { state: 'error', error: error instanceof Error ? error.message : 'Unknown error' };
  }
} 