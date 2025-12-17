export interface MovieData {
  id: string;
  title: string;
  description: string;
  posterUrl?: string;
  releaseYear?: string;
  genres?: string[];
  votes: {
    yes: number;
    no: number;
  };
  commentCount?: number;
  isTVShow?: boolean;
  tmdbId: string;
  contractId?: string; // Contract movie ID (sequential integer as string)
  createdAt: any;
  updatedAt: any;
}

export interface CommentReply {
  address: string;
  content: string;
  timestamp: string;
  likes: string[];
}

export interface CommentData {
  id: string;
  _id: string;
  movieId: string;
  address: string;
  content: string;
  isTVShow?: boolean;
  likes: string[];
  replies: CommentReply[];
  timestamp: string;
  createdAt?: any;
}

export interface PointsData {
  address: string;
  totalPoints: number;
  votePoints: number;
  commentPoints: number;
  lastUpdated?: string;
}

export interface TVShowData extends Omit<MovieData, 'isTVShow' | 'tmdbId'> {
  tmdbId: string;
  isTVShow: true;
  firstAirDate?: string;
  seasons?: number;
  episodes?: number;
}

