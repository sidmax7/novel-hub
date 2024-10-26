import { Timestamp } from 'firebase/firestore'

export interface Novel {
  id: string;
  title: string;
  synopsis: string;
  coverPhoto: string;
  extraArt: string[];
  brand: {
    name: string;
    logo?: string;
  };
  seriesType: 'ORIGINAL' | 'TRANSLATED' | 'FAN_FIC';
  styleCategory: {
    primary: string;
    secondary?: string[];
  };
  language: {
    original: string;
    translated?: string[];
  };
  publishers: {
    original: string;
    english?: string;
  };
  releaseFrequency: string;
  alternativeNames: {
    abbreviations?: string[];
    originalName?: string;
    otherNames?: string[];
  };
  chapterType: 'TEXT' | 'MANGA' | 'VIDEO';
  totalChapters: number;
  seriesStatus: 'ONGOING' | 'COMPLETED' | 'ON HOLD' | 'CANCELLED' | 'UPCOMING';
  availability: {
    type: 'FREE' | 'FREEMIUM' | 'PAID';
    price?: number;
  };
  seriesInfo: {
    volumeNumber?: number;
    seriesNumber?: number;
    releaseYear: number;
    releaseMonth: number;
    firstReleaseDate: Timestamp;
  };
  credits: {
    authors: string[];
    artists?: {
      translators?: string[];
      editors?: string[];
      proofreaders?: string[];
      posters?: string[];
      rawProviders?: string[];
      artDirectors?: string[];
      drafters?: string[];
      lineArtists?: string[];
      colorArtists?: string[];
      compositors?: string[];
      typesetters?: string[];
      projectManagers?: string[];
    };
  };
  genres: {
    name: string;
    description?: string;
  }[];
  tags: string[];
  metadata: {
    createdAt: Timestamp;
    updatedAt: Timestamp;
  };
  likes: number;
  views: number;
  uploader?: string;
  rating: number;
}
