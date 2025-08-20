# Farcaster API Setup Guide

This project now uses the official Farcaster Client API instead of Neynar. To enable authenticated API calls, you need to configure your Farcaster App Key.

## Setup Steps

### 1. Create an App Key
1. Go to [Farcaster](https://farcaster.xyz) and sign in
2. Navigate to your profile settings
3. Create a new App Key (this will give you a private/public key pair)
4. Note down your FID (Farcaster ID) number

### 2. Environment Variables
Create a `.env.local` file in your project root with:

```bash
# Farcaster API Authentication (NEXT_PUBLIC_ prefix required for browser access)
NEXT_PUBLIC_FARCASTER_FID=your_fid_number_here
NEXT_PUBLIC_FARCASTER_PRIVATE_KEY=your_app_key_private_key_here
NEXT_PUBLIC_FARCASTER_PUBLIC_KEY=your_app_key_public_key_here
```

### 3. Example Values
```bash
NEXT_PUBLIC_FARCASTER_FID=6841
NEXT_PUBLIC_FARCASTER_PRIVATE_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
NEXT_PUBLIC_FARCASTER_PUBLIC_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
```

## What's Implemented

✅ **Authentication**: Proper JWT token generation using @noble/ed25519 (browser-compatible)
✅ **User Lookup**: Get user info by FID
✅ **Custody Address Lookup**: Find FID by wallet address
✅ **Channel APIs**: Get all channels and individual channel info
✅ **Error Handling**: Graceful fallbacks when auth isn't configured
✅ **Browser Compatibility**: Works in Next.js client components

## API Endpoints Used

- `GET /v1/user?fid={fid}` - Get user by FID
- `GET /v1/user-by-custody-address?custody_address={address}` - Get user by wallet
- `GET /v2/all-channels` - Get all channels (no auth required)
- `GET /v1/channel?channelId={id}` - Get specific channel (no auth required)

## Notes

- **No Auth Required**: Channel endpoints work without authentication
- **Graceful Degradation**: If auth isn't configured, API calls still work but without authentication
- **Token Expiry**: Auth tokens expire after 5 minutes and are regenerated automatically
- **Security**: Private keys are exposed to the browser (use with caution in production)
- **Browser Compatible**: Uses @noble/ed25519 instead of Node.js-specific libraries

## Testing

You can test the implementation by:

1. Setting up the environment variables
2. Calling `getFarcasterUser(fid)` or `getAllChannels()`
3. Checking the browser console for authentication status
4. Visiting `/test-farcaster` to test the APIs

## Security Considerations

⚠️ **Important**: Since this runs in the browser, your private key will be visible to users. For production use, consider:
- Using server-side authentication only
- Implementing a proxy API that handles authentication server-side
- Using session-based authentication instead of exposing private keys
