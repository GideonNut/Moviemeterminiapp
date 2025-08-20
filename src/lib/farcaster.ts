// Native Farcaster API client - no Neynar dependency
import { sign } from '@noble/ed25519';
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

export interface FarcasterChannel {
  id: string;
  url: string;
  name: string;
  description: string;
  descriptionMentions: number[];
  descriptionMentionsPositions: number[];
  leadFid: number;
  moderatorFids: number[];
  createdAt: number;
  followerCount: number;
  memberCount: number;
  pinnedCastHash?: string;
  publicCasting: boolean;
  externalLink?: {
    title: string;
    url: string;
  };
}

// Use the official Farcaster API
const FARCASTER_API_BASE = 'https://api.farcaster.xyz';

// Authentication configuration - you'll need to set these
const FARCASTER_CONFIG = {
  fid: process.env.NEXT_PUBLIC_FARCASTER_FID ? parseInt(process.env.NEXT_PUBLIC_FARCASTER_FID) : undefined,
  privateKey: process.env.NEXT_PUBLIC_FARCASTER_PRIVATE_KEY,
  publicKey: process.env.NEXT_PUBLIC_FARCASTER_PUBLIC_KEY,
};

/**
 * Generate authentication token for Farcaster API
 * Based on the official API reference, adapted for browser compatibility
 */
async function generateAuthToken(): Promise<string | null> {
  if (!FARCASTER_CONFIG.fid || !FARCASTER_CONFIG.privateKey || !FARCASTER_CONFIG.publicKey) {
    console.warn('Farcaster authentication not configured. Set NEXT_PUBLIC_FARCASTER_FID, NEXT_PUBLIC_FARCASTER_PRIVATE_KEY, and NEXT_PUBLIC_FARCASTER_PUBLIC_KEY environment variables.');
    return null;
  }

  try {
    // Convert hex private key to Uint8Array
    const privateKeyBytes = new Uint8Array(
      FARCASTER_CONFIG.privateKey.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []
    );
    
    const header = {
      fid: FARCASTER_CONFIG.fid,
      type: 'app_key',
      key: FARCASTER_CONFIG.publicKey
    };
    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');

    const payload = { exp: Math.floor(Date.now() / 1000) + 300 }; // 5 minutes
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');

    // Create message hash to sign
    const message = `${encodedHeader}.${encodedPayload}`;
    const messageBytes = new TextEncoder().encode(message);
    
    // Sign the message
    const signature = await sign(messageBytes, privateKeyBytes);
    const encodedSignature = Buffer.from(signature).toString("base64url");

    return encodedHeader + "." + encodedPayload + "." + encodedSignature;
  } catch (error) {
    console.error('Error generating auth token:', error);
    return null;
  }
}

/**
 * Make authenticated request to Farcaster API
 */
async function makeAuthenticatedRequest(endpoint: string, options: RequestInit = {}) {
  const authToken = await generateAuthToken();
  
  const headers = {
    'Content-Type': 'application/json',
    'accept': 'application/json',
    ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
    ...options.headers,
  };

  return fetch(`${FARCASTER_API_BASE}${endpoint}`, {
    ...options,
    headers,
  });
}

export async function getFarcasterUser(fid: number): Promise<FarcasterUser | null> {
  try {
    // Try the authenticated endpoint first, fallback to unauthenticated
    let response = await makeAuthenticatedRequest(`/v1/user?fid=${fid}`);
    
    // If authenticated request fails, try without auth
    if (!response.ok) {
      console.log('Authenticated request failed, trying without auth...');
      response = await fetch(`${FARCASTER_API_BASE}/v1/user?fid=${fid}`);
    }

    if (!response.ok) {
      console.error('Error fetching Farcaster user:', response.statusText);
      return null;
    }

    const data = await response.json();

    // The Farcaster API response structure
    const rawUser = data?.result?.user ?? data?.user ?? data;

    if (!rawUser) return null;

    const normalized: FarcasterUser = {
      fid: Number(rawUser.fid ?? rawUser.id ?? 0),
      username: rawUser.username ?? rawUser.handle ?? '',
      displayName: rawUser.displayName ?? rawUser.name ?? '',
      pfp: rawUser.pfp?.url ?? rawUser.pfpUrl ?? rawUser.avatar_url ?? '',
      followerCount: rawUser.followerCount ?? rawUser.stats?.followerCount ?? 0,
      followingCount: rawUser.followingCount ?? rawUser.stats?.followingCount ?? 0,
      verifications: Array.isArray(rawUser.verifications) ? rawUser.verifications : [],
      bio: {
        text: rawUser.bio?.text ?? rawUser.bio ?? '',
        mentions: Array.isArray(rawUser.bio?.mentions) ? rawUser.bio.mentions : [],
      },
    };

    return normalized;
  } catch (error) {
    console.error('Error getting Farcaster user:', error);
    return null;
  }
}

export async function lookupFidByCustodyAddress(custodyAddress: string): Promise<number | null> {
  try {
    // Try the authenticated endpoint first, fallback to unauthenticated
    let response = await makeAuthenticatedRequest(
      `/v1/user-by-custody-address?custody_address=${custodyAddress.toLowerCase()}`
    );
    
    // If authenticated request fails, try without auth
    if (!response.ok) {
      console.log('Authenticated request failed, trying without auth...');
      response = await fetch(`${FARCASTER_API_BASE}/v1/user-by-custody-address?custody_address=${custodyAddress.toLowerCase()}`);
    }

    if (!response.ok) {
      console.error('Error looking up FID:', response.statusText);
      return null;
    }

    const data = await response.json();
    
    if (data.result?.user?.fid) {
      return data.result.user.fid;
    }

    throw new Error('No FID found for this custody address');
  } catch (error) {
    console.error('Error looking up FID by custody address:', error);
    throw new Error(`Failed to lookup FID: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get all channels (no authentication required)
 */
export async function getAllChannels(): Promise<FarcasterChannel[]> {
  try {
    const response = await fetch(`${FARCASTER_API_BASE}/v2/all-channels`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch channels: ${response.statusText}`);
    }

    const data = await response.json();
    return data.result?.channels ?? [];
  } catch (error) {
    console.error('Error fetching channels:', error);
    return [];
  }
}

/**
 * Get a specific channel by ID (no authentication required)
 */
export async function getChannel(channelId: string): Promise<FarcasterChannel | null> {
  try {
    const response = await fetch(`${FARCASTER_API_BASE}/v1/channel?channelId=${channelId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch channel: ${response.statusText}`);
    }

    const data = await response.json();
    return data.result?.channel ?? null;
  } catch (error) {
    console.error('Error fetching channel:', error);
    return null;
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