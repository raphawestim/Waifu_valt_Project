import type { MangaAnimeSearchResult } from '../types/manga.types';

interface AniListMedia {
  id: number;
  type: 'ANIME' | 'MANGA';
  title: {
    romaji?: string;
    english?: string;
    native?: string;
  };
  description?: string;
  status?: string;
  averageScore?: number;
  seasonYear?: number;
  startDate?: {
    year?: number;
  };
  coverImage?: {
    large?: string;
    medium?: string;
  };
  bannerImage?: string;
  genres?: string[];
  siteUrl: string;
}

interface AniListResponse {
  data?: {
    Page?: {
      media?: AniListMedia[];
    };
  };
  errors?: Array<{ message: string }>;
}

const ANILIST_QUERY = `
  query SearchMedia($search: String) {
    Page(page: 1, perPage: 8) {
      media(search: $search, sort: POPULARITY_DESC) {
        id
        type
        title {
          romaji
          english
          native
        }
        description(asHtml: false)
        status
        averageScore
        seasonYear
        startDate {
          year
        }
        coverImage {
          large
          medium
        }
        bannerImage
        genres
        siteUrl
      }
    }
  }
`;

const ANILIST_TRENDING_QUERY = `
  query TrendingMedia {
    Page(page: 1, perPage: 12) {
      media(type: MANGA, sort: TRENDING_DESC) {
        id
        type
        title {
          romaji
          english
          native
        }
        description(asHtml: false)
        status
        averageScore
        seasonYear
        startDate {
          year
        }
        coverImage {
          large
          medium
        }
        bannerImage
        genres
        siteUrl
      }
    }
  }
`;

const aniListSearchCache = new Map<string, MangaAnimeSearchResult[]>();

export async function searchAniList(query: string): Promise<MangaAnimeSearchResult[]> {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) return [];
  const cacheKey = trimmedQuery.toLowerCase();
  const cachedResults = aniListSearchCache.get(cacheKey);
  if (cachedResults) return cachedResults;

  const response = await fetch('https://graphql.anilist.co', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ query: ANILIST_QUERY, variables: { search: trimmedQuery } }),
  });
  const payload = (await response.json()) as AniListResponse;

  if (!response.ok || payload.errors?.length) {
    throw new Error(payload.errors?.[0]?.message || 'AniList search failed.');
  }

  const results = (payload.data?.Page?.media || []).map(mapAniListMedia);
  aniListSearchCache.set(cacheKey, results);
  return results;
}

function mapAniListMedia(media: AniListMedia): MangaAnimeSearchResult {
  return {
    id: `anilist-${media.id}`,
    source: 'anilist',
    title: media.title.english || media.title.romaji || media.title.native || 'Untitled media',
    kind: media.type === 'ANIME' ? 'anime' : 'manga',
    description: media.description?.replace(/<[^>]+>/g, '').slice(0, 220),
    imageUrl: media.coverImage?.large || media.coverImage?.medium,
    bannerUrl: media.bannerImage,
    genres: media.genres,
    status: media.status,
    score: media.averageScore,
    year: media.seasonYear || media.startDate?.year,
    sourceUrl: media.siteUrl,
  };
}

export async function getTrendingManga(): Promise<MangaAnimeSearchResult[]> {
  const response = await fetch('https://graphql.anilist.co', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ query: ANILIST_TRENDING_QUERY }),
  });
  const payload = (await response.json()) as AniListResponse;

  if (!response.ok || payload.errors?.length) {
    throw new Error(payload.errors?.[0]?.message || 'AniList trending request failed.');
  }

  return (payload.data?.Page?.media || []).map(mapAniListMedia);
}
