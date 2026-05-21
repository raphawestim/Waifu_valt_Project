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

export interface MangaAnimeSearchResult {
  id: string;
  source: 'anilist' | 'jikan' | 'mangadex' | 'kitsu';
  title: string;
  kind: 'anime' | 'manga';
  description?: string;
  imageUrl?: string;
  bannerUrl?: string;
  genres?: string[];
  status?: string;
  score?: number;
  year?: number;
  sourceUrl: string;
}
