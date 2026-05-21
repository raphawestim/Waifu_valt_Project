import type { MangaApiRegistryItem } from '../types/manga.types';

export const mangaApiRegistry: MangaApiRegistryItem[] = [
  {
    id: 'anilist',
    name: 'AniList',
    category: 'GraphQL API',
    description: 'Anime and manga metadata, characters, relations, genres, rankings, covers, popularity and status.',
    status: 'active',
    tags: ['anime', 'manga', 'graphql', 'characters', 'rankings'],
    baseUrl: 'https://graphql.anilist.co',
    docsUrl: 'https://docs.anilist.co/',
  },
  {
    id: 'mangadex',
    name: 'MangaDex',
    category: 'REST API',
    description: 'Planned metadata-focused manga catalog integration for chapters, covers, authors and groups.',
    status: 'planned',
    tags: ['manga', 'chapters', 'covers', 'authors', 'metadata'],
    baseUrl: 'https://api.mangadex.org',
    docsUrl: 'https://api.mangadex.org/docs/',
  },
  {
    id: 'jikan',
    name: 'Jikan',
    category: 'MyAnimeList Unofficial API',
    description: 'Anime and manga search, popularity, rankings and fallback metadata with debounce and cache.',
    status: 'active',
    tags: ['anime', 'manga', 'rankings', 'popular', 'fallback'],
    baseUrl: 'https://api.jikan.moe/v4',
    docsUrl: 'https://docs.api.jikan.moe/',
  },
  {
    id: 'kitsu',
    name: 'Kitsu',
    category: 'JSON:API',
    description: 'Planned anime and manga discovery, tracking and metadata source.',
    status: 'planned',
    tags: ['anime', 'manga', 'discovery', 'tracking'],
    baseUrl: 'https://kitsu.io/api/edge',
    docsUrl: 'https://kitsu.docs.apiary.io/',
  },
];

export const activeMangaApis = mangaApiRegistry.filter((api) => api.status === 'active');
export const plannedMangaApis = mangaApiRegistry.filter((api) => api.status !== 'active');
