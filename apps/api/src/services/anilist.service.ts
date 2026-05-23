import { fetchCachedJson } from './externalFetch.service.js';

const ANILIST_URL = 'https://graphql.anilist.co';
const TTL = 60 * 60;

type AniListMediaType = 'MANGA' | 'ANIME';

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

function normalizeType(type?: string): AniListMediaType | undefined {
  const upper = type?.toUpperCase();
  if (upper === 'ANIME' || upper === 'MANGA') return upper;
  return undefined;
}

function postGraphql(endpoint: string, query: string, variables: Record<string, unknown>) {
  return fetchCachedJson({
    provider: 'anilist',
    endpoint,
    url: ANILIST_URL,
    ttlSeconds: TTL,
    init: {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ query, variables }),
    },
    cacheParams: { query, variables },
  });
}

export const anilistService = {
  search(query: string, type?: string) {
    return postGraphql('search', SEARCH_QUERY, { search: query, type: normalizeType(type) });
  },

  trending(type?: string) {
    return postGraphql('trending', TRENDING_QUERY, { type: normalizeType(type) || 'MANGA', sort: ['TRENDING_DESC'] });
  },

  popular(type?: string) {
    return postGraphql('popular', TRENDING_QUERY, { type: normalizeType(type) || 'MANGA', sort: ['POPULARITY_DESC'] });
  },

  mediaDetails(id: number) {
    return postGraphql('media:details', DETAILS_QUERY, { id });
  },
};
