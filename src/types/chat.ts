export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface NovelPreference {
  genres?: string[];
  tags?: string[];
  mood?: string[];
  status?: 'ONGOING' | 'COMPLETED' | 'ON HOLD' | 'CANCELLED' | 'UPCOMING';
  type?: 'Web Novel' | 'Light Novel' | 'Novel';
  seriesType?: 'ORIGINAL' | 'TRANSLATED' | 'FAN_FIC';
  minRating?: number;
  excludedGenres?: string[];
  excludedTags?: string[];
  availability?: 'FREE' | 'FREEMIUM' | 'PAID';
}

export interface RecommendationResponse {
  preferences: NovelPreference;
  recommendations: Novel[];
  explanation: string;
}

export interface Novel {
  novelId: string;
  title: string;
  publishers: {
    original: string;
    english?: string;
  };
  genres: { name: string }[];
  rating: number;
  coverPhoto: string;
  authorId: string;
  tags: string[];
  likes: number;
  synopsis: string;
  type?: string;
  lastUpdated?: string;
  firstReleaseDate?: string | null;
  chapters?: number;
  language?: {
    original: string;
    translated?: string[];
  };
  rank?: number;
  seriesInfo: {
    firstReleaseDate: any;
  };
  status?: 'Ongoing' | 'Completed' | 'Hiatus' | 'Cancelled';
  chapterType?: 'Web Novel' | 'Light Novel' | 'Novel';
  seriesType: 'ORIGINAL' | 'TRANSLATED' | 'FAN_FIC';
  seriesStatus: 'ONGOING' | 'COMPLETED' | 'ON HOLD' | 'CANCELLED' | 'UPCOMING';
  availability: {
    type: 'FREE' | 'FREEMIUM' | 'PAID';
    price?: number;
  };
} 