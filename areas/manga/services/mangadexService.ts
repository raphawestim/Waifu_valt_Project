import type { MangaDexChapter, MangaMediaItem } from '../types/manga.types';

interface MangaDexManga {
  id: string;
  attributes?: {
    title?: Record<string, string>;
    altTitles?: Array<Record<string, string>>;
    description?: Record<string, string>;
    status?: string;
    year?: number;
    tags?: Array<{ attributes?: { name?: Record<string, string> } }>;
    links?: Record<string, string>;
  };
  relationships?: Array<{ id: string; type: string; attributes?: { fileName?: string; name?: string } }>;
}

interface MangaDexResponse {
  data?: MangaDexManga[];
}

interface MangaDexDetailsResponse {
  data?: MangaDexManga;
}

interface MangaDexChapterResponse {
  data?: Array<{
    id: string;
    attributes?: {
      title?: string;
      chapter?: string;
      volume?: string;
      translatedLanguage?: string;
      publishAt?: string;
    };
  }>;
}

const MANGADEX_BASE_URL = 'https://api.mangadex.org';

function pickLocalized(value?: Record<string, string>) {
  if (!value) return undefined;
  return value.en || Object.values(value)[0];
}

function coverFromRelationships(manga: MangaDexManga) {
  const cover = manga.relationships?.find((item) => item.type === 'cover_art');
  return cover?.attributes?.fileName ? getMangaDexCoverUrl(manga.id, cover.attributes.fileName) : undefined;
}

function normalizeMangaDex(manga: MangaDexManga): MangaMediaItem {
  const title = pickLocalized(manga.attributes?.title) || 'Untitled manga';
  return {
    id: `mangadex-${manga.id}`,
    source: 'mangadex',
    externalId: manga.id,
    type: 'manga',
    title,
    titleNative: manga.attributes?.altTitles?.map(pickLocalized).filter(Boolean)[0],
    description: pickLocalized(manga.attributes?.description),
    coverUrl: coverFromRelationships(manga),
    genres: manga.attributes?.tags?.map((tag) => pickLocalized(tag.attributes?.name)).filter(Boolean) as string[] | undefined,
    status: manga.attributes?.status,
    year: manga.attributes?.year,
    sourceUrl: `https://mangadex.org/title/${manga.id}`,
    metadata: { provider: 'MangaDex', reader: 'metadata-only-mvp' },
  };
}

async function fetchMangaDex<T>(path: string): Promise<T> {
  const response = await fetch(`${MANGADEX_BASE_URL}${path}`);
  if (!response.ok) throw new Error('MangaDex request failed.');
  return (await response.json()) as T;
}

export async function searchMangaDexManga(query: string): Promise<MangaMediaItem[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];
  const payload = await fetchMangaDex<MangaDexResponse>(`/manga?title=${encodeURIComponent(trimmed)}&limit=12&includes[]=cover_art&contentRating[]=safe&contentRating[]=suggestive`);
  return (payload.data || []).map(normalizeMangaDex);
}

export async function getMangaDexMangaDetails(id: string): Promise<MangaMediaItem> {
  const mangaId = id.replace('mangadex-', '');
  const payload = await fetchMangaDex<MangaDexDetailsResponse>(`/manga/${mangaId}?includes[]=cover_art`);
  if (!payload.data) throw new Error('MangaDex manga not found.');
  return normalizeMangaDex(payload.data);
}

export function getMangaDexCoverUrl(mangaId: string, coverFileName: string): string {
  return `https://uploads.mangadex.org/covers/${mangaId}/${coverFileName}.512.jpg`;
}

export async function getMangaDexChapters(mangaId: string): Promise<MangaDexChapter[]> {
  const id = mangaId.replace('mangadex-', '');
  const payload = await fetchMangaDex<MangaDexChapterResponse>(`/manga/${id}/feed?limit=20&translatedLanguage[]=en&order[chapter]=asc`);
  return (payload.data || []).map((chapter) => ({
    id: chapter.id,
    title: chapter.attributes?.title,
    chapter: chapter.attributes?.chapter,
    volume: chapter.attributes?.volume,
    translatedLanguage: chapter.attributes?.translatedLanguage,
    publishAt: chapter.attributes?.publishAt,
  }));
}

export function getMangaDexPlanningNote(): string {
  return 'MangaDex is enabled for metadata/chapter discovery only. Reader delivery remains planned and source-limited.';
}
