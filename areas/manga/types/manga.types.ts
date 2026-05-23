export type ApiStatus = 'active' | 'planned' | 'disabled' | 'error';

export interface MangaApiRegistryItem {
  id: string;
  name: string;
  category: string;
  description: string;
  status: ApiStatus;
  tags: string[];
  baseUrl?: string;
  docsUrl?: string;
  requiresApiKey?: boolean;
}

export type MangaSource = 'anilist' | 'jikan' | 'mangadex' | 'kitsu' | 'custom';
export type MediaType = 'manga' | 'anime';
export type UserMangaStatus = 'favorite' | 'want_to_read' | 'reading' | 'completed' | 'paused' | 'dropped';

export interface MangaMediaItem {
  id: string;
  source: MangaSource;
  externalId: string;
  type: MediaType;
  title: string;
  titleNative?: string;
  description?: string;
  coverUrl?: string;
  bannerUrl?: string;
  genres?: string[];
  status?: string;
  chapters?: number;
  volumes?: number;
  episodes?: number;
  score?: number;
  popularity?: number;
  year?: number;
  format?: string;
  sourceUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface UserMangaItem {
  id: string;
  userId: string;
  source: MangaSource;
  externalId: string;
  type: MediaType;
  title: string;
  coverUrl?: string;
  bannerUrl?: string;
  authors?: string[];
  genres?: string[];
  status: UserMangaStatus;
  currentChapter?: number;
  totalChapters?: number;
  currentEpisode?: number;
  totalEpisodes?: number;
  personalRating?: number;
  notes?: string;
  isFavorite: boolean;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface MangaLibraryStats {
  total: number;
  favorites: number;
  reading: number;
  wantToRead: number;
  completed: number;
  paused: number;
  dropped: number;
}

export interface MangaDexChapter {
  id: string;
  title?: string;
  chapter?: string;
  volume?: string;
  translatedLanguage?: string;
  publishAt?: string;
}

// Backward-compatible alias for existing components while the Manga Vault migrates.
export interface MangaAnimeSearchResult {
  id: string;
  source: Exclude<MangaSource, 'custom'>;
  title: string;
  kind: MediaType;
  description?: string;
  imageUrl?: string;
  bannerUrl?: string;
  genres?: string[];
  status?: string;
  score?: number;
  year?: number;
  sourceUrl: string;
}

export function mediaToSearchResult(item: MangaMediaItem): MangaAnimeSearchResult {
  return {
    id: item.id,
    source: item.source === 'custom' ? 'anilist' : item.source,
    title: item.title,
    kind: item.type,
    description: item.description,
    imageUrl: item.coverUrl,
    bannerUrl: item.bannerUrl,
    genres: item.genres,
    status: item.status,
    score: item.score,
    year: item.year,
    sourceUrl: item.sourceUrl || '#',
  };
}
