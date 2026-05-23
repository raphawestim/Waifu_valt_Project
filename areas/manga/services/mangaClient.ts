import { apiDelete, apiGet, apiPatch, apiPost } from '../../../shared/services/apiClient';
import type { UserMangaItem } from '../types/manga.types';

export type MangaItemPayload = Omit<UserMangaItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;
export type MangaItemPatch = Partial<MangaItemPayload>;

function toPayload(item: UserMangaItem): MangaItemPayload {
  return {
    source: item.source,
    externalId: item.externalId,
    type: item.type,
    title: item.title,
    coverUrl: item.coverUrl,
    bannerUrl: item.bannerUrl,
    authors: item.authors || [],
    genres: item.genres || [],
    status: item.status,
    currentChapter: item.currentChapter,
    totalChapters: item.totalChapters,
    currentEpisode: item.currentEpisode,
    totalEpisodes: item.totalEpisodes,
    personalRating: item.personalRating,
    notes: item.notes,
    isFavorite: item.isFavorite,
    metadata: item.metadata,
  };
}

export async function getBackendMangaLibrary(): Promise<UserMangaItem[]> {
  const response = await apiGet<{ manga: UserMangaItem[] }>('/me/manga');
  return response.manga || [];
}

export async function createBackendMangaItem(item: UserMangaItem): Promise<UserMangaItem> {
  const response = await apiPost<{ item: UserMangaItem }>('/me/manga', toPayload(item));
  return response.item;
}

export async function updateBackendMangaItem(itemId: string, patch: MangaItemPatch): Promise<UserMangaItem> {
  const response = await apiPatch<{ item: UserMangaItem }>(`/me/manga/${itemId}`, patch);
  return response.item;
}

export async function deleteBackendMangaItem(itemId: string): Promise<void> {
  await apiDelete(`/me/manga/${itemId}`);
}
