import type { MangaMediaItem, MediaType } from '../types/manga.types';
import { mediaToSearchResult, type MangaAnimeSearchResult } from '../types/manga.types';
import { getApiBaseUrl } from '../../../shared/services/apiClient';

type AniListType = 'MANGA' | 'ANIME';

interface AniListMedia {
  id: number;
  type: AniListType;
  title: {
    romaji?: string;
    english?: string;
    native?: string;
  };
  description?: string;
  status?: string;
  averageScore?: number;
  popularity?: number;
  seasonYear?: number;
  startDate?: { year?: number };
  coverImage?: { extraLarge?: string; large?: string; medium?: string };
  bannerImage?: string;
  genres?: string[];
  chapters?: number;
  volumes?: number;
  episodes?: number;
  format?: string;
  siteUrl?: string;
}

interface AniListResponse {
  data?: {
    Page?: { media?: AniListMedia[] };
    Media?: AniListMedia;
  };
  errors?: Array<{ message: string }>;
}

const ANILIST_URL = 'https://graphql.anilist.co';
const API_BASE_URL = getApiBaseUrl();
const cache = new Map<string, MangaMediaItem[] | MangaMediaItem>();

const MEDIA_FIELDS = `
  id
  type
  title { romaji english native }
  description(asHtml: false)
  status
  averageScore
  popularity
  seasonYear
  startDate { year }
  coverImage { extraLarge large medium }
  bannerImage
  genres
  chapters
  volumes
  episodes
  format
  siteUrl
`;

const SEARCH_QUERY = `
  query SearchMedia($search: String, $type: MediaType) {
    Page(page: 1, perPage: 16) {
      media(search: $search, type: $type, sort: POPULARITY_DESC) {
        ${MEDIA_FIELDS}
      }
    }
  }
`;

const TRENDING_QUERY = `
  query TrendingMedia($type: MediaType, $sort: [MediaSort]) {
    Page(page: 1, perPage: 16) {
      media(type: $type, sort: $sort) {
        ${MEDIA_FIELDS}
      }
    }
  }
`;

const DETAILS_QUERY = `
  query MediaDetails($id: Int) {
    Media(id: $id) {
      ${MEDIA_FIELDS}
    }
  }
`;

function stripHtml(value?: string) {
  return value?.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').trim();
}

async function requestAniList<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const response = await fetch(ANILIST_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  const payload = (await response.json()) as AniListResponse;
  if (!response.ok || payload.errors?.length) throw new Error(payload.errors?.[0]?.message || 'AniList request failed.');
  return payload as T;
}

async function fetchProxy<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`);
  const payload = (await response.json().catch(() => ({}))) as T & { message?: string };
  if (!response.ok) throw new Error(payload.message || 'AniList proxy request failed.');
  return payload;
}

const toProxyType = (type?: MediaType) => {
  if (type === 'anime') return 'ANIME';
  if (type === 'manga') return 'MANGA';
  return undefined;
};

function normalizeMedia(media: AniListMedia): MangaMediaItem {
  return {
    id: `anilist-${media.id}`,
    source: 'anilist',
    externalId: String(media.id),
    type: media.type === 'ANIME' ? 'anime' : 'manga',
    title: media.title.english || media.title.romaji || media.title.native || 'Untitled media',
    titleNative: media.title.native,
    description: stripHtml(media.description),
    coverUrl: media.coverImage?.extraLarge || media.coverImage?.large || media.coverImage?.medium,
    bannerUrl: media.bannerImage,
    genres: media.genres,
    status: media.status,
    chapters: media.chapters,
    volumes: media.volumes,
    episodes: media.episodes,
    score: media.averageScore,
    popularity: media.popularity,
    year: media.seasonYear || media.startDate?.year,
    format: media.format,
    sourceUrl: media.siteUrl,
    metadata: { provider: 'AniList' },
  };
}

const toAniListType = (type?: MediaType): AniListType | undefined => {
  if (type === 'anime') return 'ANIME';
  if (type === 'manga') return 'MANGA';
  return undefined;
};

export async function searchAniListMedia(query: string, type?: MediaType): Promise<MangaMediaItem[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];
  const cacheKey = `search:${trimmed.toLowerCase()}:${type || 'all'}`;
  const cached = cache.get(cacheKey);
  if (Array.isArray(cached)) return cached;
  let payload: AniListResponse;
  try {
    const url = new URL(`${API_BASE_URL}/external/anilist/search`);
    url.searchParams.set('q', trimmed);
    const proxyType = toProxyType(type);
    if (proxyType) url.searchParams.set('type', proxyType);
    payload = await fetchProxy<AniListResponse>(`${url.pathname}${url.search}`);
  } catch {
    payload = await requestAniList<AniListResponse>(SEARCH_QUERY, { search: trimmed, type: toAniListType(type) });
  }
  const results = (payload.data?.Page?.media || []).map(normalizeMedia);
  cache.set(cacheKey, results);
  return results;
}

export async function getTrendingManga(): Promise<MangaMediaItem[]> {
  const cacheKey = 'trending:manga';
  const cached = cache.get(cacheKey);
  if (Array.isArray(cached)) return cached;
  let payload: AniListResponse;
  try {
    payload = await fetchProxy<AniListResponse>('/external/anilist/trending?type=MANGA');
  } catch {
    payload = await requestAniList<AniListResponse>(TRENDING_QUERY, { type: 'MANGA', sort: ['TRENDING_DESC'] });
  }
  const results = (payload.data?.Page?.media || []).map(normalizeMedia);
  cache.set(cacheKey, results);
  return results;
}

export async function getPopularManga(): Promise<MangaMediaItem[]> {
  const cacheKey = 'popular:manga';
  const cached = cache.get(cacheKey);
  if (Array.isArray(cached)) return cached;
  let payload: AniListResponse;
  try {
    payload = await fetchProxy<AniListResponse>('/external/anilist/popular?type=MANGA');
  } catch {
    payload = await requestAniList<AniListResponse>(TRENDING_QUERY, { type: 'MANGA', sort: ['POPULARITY_DESC'] });
  }
  const results = (payload.data?.Page?.media || []).map(normalizeMedia);
  cache.set(cacheKey, results);
  return results;
}

export async function getMediaDetails(id: string | number): Promise<MangaMediaItem> {
  const numericId = Number(String(id).replace('anilist-', ''));
  const cacheKey = `details:${numericId}`;
  const cached = cache.get(cacheKey);
  if (cached && !Array.isArray(cached)) return cached;
  let payload: AniListResponse;
  try {
    payload = await fetchProxy<AniListResponse>(`/external/anilist/media/${numericId}`);
  } catch {
    payload = await requestAniList<AniListResponse>(DETAILS_QUERY, { id: numericId });
  }
  if (!payload.data?.Media) throw new Error('AniList media details not found.');
  const result = normalizeMedia(payload.data.Media);
  cache.set(cacheKey, result);
  return result;
}

export async function getMediaCharacters(): Promise<[]> {
  return [];
}

export async function getMediaRecommendations(): Promise<[]> {
  return [];
}

export async function searchAniList(query: string): Promise<MangaAnimeSearchResult[]> {
  return (await searchAniListMedia(query)).map(mediaToSearchResult);
}
