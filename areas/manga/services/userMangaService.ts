import {
  addGlobalFavorite,
  getGlobalFavorites,
  removeGlobalFavorite,
} from '../../../services/userProfileService';
import { ApiHttpError, ApiNetworkError, checkApiHealth, getAuthToken } from '../../../shared/services/apiClient';
import { getBackendFavorites, removeBackendFavorite } from '../../../shared/services/favoritesClient';
import {
  createBackendMangaItem,
  deleteBackendMangaItem,
  getBackendMangaLibrary,
  updateBackendMangaItem,
} from './mangaClient';
import type { MangaLibraryStats, MangaMediaItem, MangaSource, UserMangaItem, UserMangaStatus } from '../types/manga.types';

const USER_MANGA_KEY = 'thevault.userManga';
const AUTH_SESSION_KEY = 'thevault.auth.session';
const now = () => new Date().toISOString();
const storageKey = (userId: string) => `${USER_MANGA_KEY}:${userId}`;

interface StoredAuthSession {
  mode?: 'backend' | 'local';
  token?: string;
  user?: { id?: string; username?: string; authMode?: 'backend' | 'local'; token?: string };
}

function readLibrary(userId: string): UserMangaItem[] {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    return raw ? (JSON.parse(raw) as UserMangaItem[]) : [];
  } catch {
    return [];
  }
}

function writeLibrary(userId: string, items: UserMangaItem[]): UserMangaItem[] {
  localStorage.setItem(storageKey(userId), JSON.stringify(items));
  return items;
}

function readAuthSession(): StoredAuthSession | null {
  try {
    const raw = localStorage.getItem(AUTH_SESSION_KEY);
    return raw ? (JSON.parse(raw) as StoredAuthSession) : null;
  } catch {
    return null;
  }
}

function getAccountMode(): 'backend' | 'local' | null {
  const session = readAuthSession();
  if (session?.mode) return session.mode;
  if (session?.user?.authMode) return session.user.authMode;
  if (session?.token || getAuthToken()) return 'backend';
  return session?.user ? 'local' : null;
}

function hasBackendSession(): boolean {
  return getAccountMode() === 'backend' && Boolean(getAuthToken());
}

export async function shouldUseBackendStorage(): Promise<boolean> {
  if (!hasBackendSession()) return false;
  const health = await checkApiHealth();
  return Boolean(health?.ok);
}

function backendFallbackWarning(error: unknown, collectionLabel: string): string {
  if (error instanceof ApiNetworkError) return 'Backend is unreachable. Showing local fallback.';
  if (error instanceof ApiHttpError && (error.status === 401 || error.status === 403)) return 'Session expired. Please login again.';
  if (error instanceof ApiHttpError && error.status >= 500) return 'Backend error while loading collection. Showing local fallback.';
  return `${collectionLabel} backend could not be loaded. Showing local fallback.`;
}

function favoriteId(item: UserMangaItem) {
  return `manga:${item.type}:${item.source}:${item.externalId}`;
}

function removeBackendMangaFavorite(item: UserMangaItem): void {
  if (!hasBackendSession()) return;
  void getBackendFavorites()
    .then((response) => {
      const favorites = (response as { favorites?: Array<{ id: string; vault: string; type: string; source?: string; externalId?: string }> }).favorites || [];
      const match = favorites.find(
        (favorite) =>
          favorite.vault === 'manga' &&
          favorite.type === item.type &&
          favorite.source === item.source &&
          favorite.externalId === item.externalId,
      );
      if (match) return removeBackendFavorite(match.id);
      return undefined;
    })
    .catch(() => undefined);
}

function syncFavorite(userId: string, item: UserMangaItem) {
  const id = favoriteId(item);
  if (item.isFavorite || item.status === 'favorite') {
    addGlobalFavorite(userId, {
      id,
      vault: 'manga',
      type: item.type,
      source: item.source,
      externalId: item.externalId,
      title: item.title,
      thumbnailUrl: item.coverUrl,
      metadata: { status: item.status, genres: item.genres, totalChapters: item.totalChapters, totalEpisodes: item.totalEpisodes },
    });
    return;
  }
  if (getGlobalFavorites(userId).some((favorite) => favorite.id === id)) removeGlobalFavorite(userId, id);
  removeBackendMangaFavorite(item);
}

function replaceStoredItem(userId: string, previous: UserMangaItem, next: UserMangaItem): UserMangaItem[] {
  const items = getUserMangaLibrary(userId);
  const withoutPrevious = items.filter(
    (entry) =>
      entry.id !== previous.id &&
      !(entry.source === previous.source && entry.externalId === previous.externalId),
  );
  return writeLibrary(userId, [next, ...withoutPrevious]);
}

async function resolveBackendMangaItemId(item: UserMangaItem): Promise<string | null> {
  const backendItems = await getBackendMangaLibrary();
  return backendItems.find(
    (entry) =>
      entry.id === item.id ||
      (entry.source === item.source && entry.externalId === item.externalId),
  )?.id || null;
}

export function getUserMangaLibrary(userId: string): UserMangaItem[] {
  return readLibrary(userId);
}

export async function loadUserMangaLibrary(userId: string): Promise<{ items: UserMangaItem[]; storage: 'backend' | 'local'; warning?: string }> {
  if (getAccountMode() !== 'backend') return { items: getUserMangaLibrary(userId), storage: 'local' };
  if (!getAuthToken()) return { items: getUserMangaLibrary(userId), storage: 'local', warning: 'Missing auth token. Please login again.' };

  try {
    const items = await getBackendMangaLibrary();
    writeLibrary(userId, items);
    return { items, storage: 'backend' };
  } catch (error) {
    return {
      items: getUserMangaLibrary(userId),
      storage: 'local',
      warning: backendFallbackWarning(error, 'Manga'),
    };
  }
}

export function getUserMangaItemByExternalId(userId: string, source: MangaSource, externalId: string): UserMangaItem | null {
  return getUserMangaLibrary(userId).find((item) => item.source === source && item.externalId === externalId) || null;
}

export function mediaToUserMangaItem(userId: string, media: MangaMediaItem, status: UserMangaStatus = 'want_to_read'): UserMangaItem {
  const timestamp = now();
  return {
    id: `${media.source}-${media.externalId}`,
    userId,
    source: media.source,
    externalId: media.externalId,
    type: media.type,
    title: media.title,
    coverUrl: media.coverUrl,
    bannerUrl: media.bannerUrl,
    genres: media.genres,
    status,
    currentChapter: undefined,
    totalChapters: media.chapters,
    currentEpisode: undefined,
    totalEpisodes: media.episodes,
    notes: undefined,
    isFavorite: status === 'favorite',
    metadata: {
      description: media.description,
      score: media.score,
      year: media.year,
      sourceUrl: media.sourceUrl,
      format: media.format,
      titleNative: media.titleNative,
    },
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function saveUserMangaItem(userId: string, item: UserMangaItem): UserMangaItem {
  const updated = { ...item, userId, updatedAt: now() };
  const items = getUserMangaLibrary(userId);
  const next = items.some((entry) => entry.id === updated.id || (entry.source === updated.source && entry.externalId === updated.externalId))
    ? items.map((entry) => (
      entry.id === updated.id || (entry.source === updated.source && entry.externalId === updated.externalId)
        ? { ...updated, id: entry.id, createdAt: entry.createdAt || updated.createdAt }
        : entry
    ))
    : [updated, ...items];
  const saved = next.find((entry) => entry.source === updated.source && entry.externalId === updated.externalId) || updated;
  writeLibrary(userId, next);
  syncFavorite(userId, saved);
  return saved;
}

export async function saveUserMangaItemHybrid(
  userId: string,
  item: UserMangaItem,
): Promise<{ item: UserMangaItem; storage: 'backend' | 'local'; warning?: string }> {
  const localItem = saveUserMangaItem(userId, item);
  if (!hasBackendSession()) return { item: localItem, storage: 'local' };

  try {
    const backendItem = await createBackendMangaItem(localItem);
    replaceStoredItem(userId, localItem, backendItem);
    syncFavorite(userId, backendItem);
    return { item: backendItem, storage: 'backend' };
  } catch (error) {
    return {
      item: localItem,
      storage: 'local',
      warning: error instanceof ApiNetworkError
        ? 'Backend is offline. Changes may use local fallback.'
        : 'Manga item could not be saved to backend. Kept local fallback.',
    };
  }
}

export function updateUserMangaItem(userId: string, itemId: string, patch: Partial<UserMangaItem>): UserMangaItem {
  const item = getUserMangaLibrary(userId).find((entry) => entry.id === itemId);
  if (!item) throw new Error('Manga library item not found.');
  return saveUserMangaItem(userId, { ...item, ...patch, id: item.id, userId });
}

export async function updateUserMangaItemHybrid(
  userId: string,
  itemId: string,
  patch: Partial<UserMangaItem>,
): Promise<{ item: UserMangaItem; storage: 'backend' | 'local'; warning?: string }> {
  const updated = updateUserMangaItem(userId, itemId, patch);
  if (!hasBackendSession()) return { item: updated, storage: 'local' };

  try {
    const backendId = await resolveBackendMangaItemId(updated);
    const backendItem = backendId
      ? await updateBackendMangaItem(backendId, {
        source: updated.source,
        externalId: updated.externalId,
        type: updated.type,
        title: updated.title,
        coverUrl: updated.coverUrl,
        bannerUrl: updated.bannerUrl,
        authors: updated.authors || [],
        genres: updated.genres || [],
        status: updated.status,
        currentChapter: updated.currentChapter,
        totalChapters: updated.totalChapters,
        currentEpisode: updated.currentEpisode,
        totalEpisodes: updated.totalEpisodes,
        personalRating: updated.personalRating,
        notes: updated.notes,
        isFavorite: updated.isFavorite,
        metadata: updated.metadata,
      })
      : await createBackendMangaItem(updated);
    replaceStoredItem(userId, updated, backendItem);
    syncFavorite(userId, backendItem);
    return { item: backendItem, storage: 'backend' };
  } catch (error) {
    return {
      item: updated,
      storage: 'local',
      warning: error instanceof ApiNetworkError
        ? 'Backend is offline. Changes may use local fallback.'
        : 'Manga item could not be updated in backend. Kept local fallback.',
    };
  }
}

export function deleteUserMangaItem(userId: string, itemId: string): void {
  const item = getUserMangaLibrary(userId).find((entry) => entry.id === itemId);
  writeLibrary(userId, getUserMangaLibrary(userId).filter((entry) => entry.id !== itemId));
  if (item) {
    removeGlobalFavorite(userId, favoriteId(item));
    removeBackendMangaFavorite(item);
  }
}

export async function deleteUserMangaItemHybrid(
  userId: string,
  itemId: string,
): Promise<{ storage: 'backend' | 'local'; warning?: string }> {
  const item = getUserMangaLibrary(userId).find((entry) => entry.id === itemId);
  deleteUserMangaItem(userId, itemId);

  if (!item || !hasBackendSession()) return { storage: 'local' };

  try {
    const backendId = await resolveBackendMangaItemId(item);
    if (backendId) await deleteBackendMangaItem(backendId);
    return { storage: 'backend' };
  } catch (error) {
    return {
      storage: 'local',
      warning: error instanceof ApiNetworkError
        ? 'Backend is offline. Changes may use local fallback.'
        : 'Manga item was removed locally, but backend removal could not be confirmed.',
    };
  }
}

export function toggleUserMangaFavorite(userId: string, itemId: string): UserMangaItem {
  const item = getUserMangaLibrary(userId).find((entry) => entry.id === itemId);
  if (!item) throw new Error('Manga library item not found.');
  return saveUserMangaItem(userId, { ...item, isFavorite: !item.isFavorite, status: !item.isFavorite ? 'favorite' : item.status });
}

export async function toggleUserMangaFavoriteHybrid(
  userId: string,
  itemId: string,
): Promise<{ item: UserMangaItem; storage: 'backend' | 'local'; warning?: string }> {
  const item = getUserMangaLibrary(userId).find((entry) => entry.id === itemId);
  if (!item) throw new Error('Manga library item not found.');
  return updateUserMangaItemHybrid(userId, itemId, { isFavorite: !item.isFavorite, status: !item.isFavorite ? 'favorite' : item.status });
}

export function updateUserMangaStatus(userId: string, itemId: string, status: UserMangaStatus): UserMangaItem {
  const item = getUserMangaLibrary(userId).find((entry) => entry.id === itemId);
  if (!item) throw new Error('Manga library item not found.');
  return saveUserMangaItem(userId, { ...item, status, isFavorite: status === 'favorite' || item.isFavorite });
}

export async function updateUserMangaStatusHybrid(
  userId: string,
  itemId: string,
  status: UserMangaStatus,
): Promise<{ item: UserMangaItem; storage: 'backend' | 'local'; warning?: string }> {
  const item = getUserMangaLibrary(userId).find((entry) => entry.id === itemId);
  if (!item) throw new Error('Manga library item not found.');
  return updateUserMangaItemHybrid(userId, itemId, { status, isFavorite: status === 'favorite' || item.isFavorite });
}

export function updateReadingProgress(userId: string, itemId: string, progress: Partial<Pick<UserMangaItem, 'currentChapter' | 'currentEpisode' | 'notes' | 'personalRating'>>): UserMangaItem {
  const item = getUserMangaLibrary(userId).find((entry) => entry.id === itemId);
  if (!item) throw new Error('Manga library item not found.');
  return saveUserMangaItem(userId, { ...item, ...progress });
}

export async function updateReadingProgressHybrid(
  userId: string,
  itemId: string,
  progress: Partial<Pick<UserMangaItem, 'currentChapter' | 'currentEpisode' | 'notes' | 'personalRating'>>,
): Promise<{ item: UserMangaItem; storage: 'backend' | 'local'; warning?: string }> {
  return updateUserMangaItemHybrid(userId, itemId, progress);
}

export function getUserMangaStats(userId: string): MangaLibraryStats {
  const items = getUserMangaLibrary(userId);
  return {
    total: items.length,
    favorites: items.filter((item) => item.isFavorite || item.status === 'favorite').length,
    reading: items.filter((item) => item.status === 'reading').length,
    wantToRead: items.filter((item) => item.status === 'want_to_read').length,
    completed: items.filter((item) => item.status === 'completed').length,
    paused: items.filter((item) => item.status === 'paused').length,
    dropped: items.filter((item) => item.status === 'dropped').length,
  };
}
