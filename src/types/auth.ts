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

