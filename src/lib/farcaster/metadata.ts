/**
 * Farcaster metadata function
 */
export async function getFarcasterMetadata() {
  // This should return the Farcaster mini app metadata
  // For now, return a basic structure
  return {
    name: process.env.NEXT_PUBLIC_FRAME_NAME || "MovieMeter",
    description: process.env.NEXT_PUBLIC_FRAME_DESCRIPTION || "Vote on movies with your Farcaster friends",
    iconUrl: "/icon.png",
    homeUrl: process.env.NEXT_PUBLIC_URL || "https://moviemetrer.vercel.app",
    frame: {
      version: "1",
      name: process.env.NEXT_PUBLIC_FRAME_NAME || "MovieMeter",
      iconUrl: "/icon.png",
      homeUrl: process.env.NEXT_PUBLIC_URL || "https://moviemetrer.vercel.app",
      imageUrl: "/api/opengraph-image",
      buttonTitle: process.env.NEXT_PUBLIC_FRAME_BUTTON_TEXT || "Launch MovieMeter",
      splashImageUrl: "/splash.png",
      splashBackgroundColor: "#0A0A0A",
      description: process.env.NEXT_PUBLIC_FRAME_DESCRIPTION || "Vote on movies with your Farcaster friends",
      primaryCategory: process.env.NEXT_PUBLIC_FRAME_PRIMARY_CATEGORY || "entertainment",
    }
  };
}

