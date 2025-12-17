export interface Media {
  id: string;
  _id?: string;
  title: string;
  description: string;
  posterUrl?: string;
  releaseYear?: string | Date;
  genres?: string[];
  votes: {
    yes: number;
    no: number;
  };
  commentCount?: number;
  contractId: number; // Changed to required number for derived contract IDs
  createdAt: string | Date;
  updatedAt: string | Date;
  isTVShow?: boolean;
}

export interface Movie extends Media {
  isTVShow?: false;
}

export interface TVShow extends Media {
  isTVShow: true;
  firstAirDate?: string | Date;
  seasons?: number;
  episodes?: number;
  releaseYear?: never; // TV shows should use firstAirDate instead
}

export type MediaItem = Movie | TVShow;

