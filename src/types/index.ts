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
  contractId?: string; // Contract movie/TV show ID (sequential integer as string)
  createdAt: string | Date;
  updatedAt: string | Date;
  isTVShow?: boolean;
}

export interface Movie extends Media {
  isTVShow?: false;
}

export interface TVShow extends Media {
  isTVShow: true;
  seasons?: number;
  episodes?: number;
}

export type MediaItem = Movie | TVShow;
