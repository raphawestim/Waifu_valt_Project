import {
  addGlobalFavorite,
  getGlobalFavorites,
  removeGlobalFavorite,
} from '../../../services/userProfileService';
import { ApiHttpError, ApiNetworkError, checkApiHealth, getAuthToken } from '../../../shared/services/apiClient';
import { getBackendFavorites, removeBackendFavorite } from '../../../shared/services/favoritesClient';
import {
  createBackendUserGame,
  deleteBackendUserGame,
  getBackendUserGames,
} from './gamesClient';
import type {
  GameLibraryStats,
  GamePersonalStatus,
  RawgGame,
  UserGame,
} from '../types/games.types';

const USER_GAMES_KEY = 'thevault.userGames';
const AUTH_SESSION_KEY = 'thevault.auth.session';
const now = () => new Date().toISOString();
const storageKey = (userId: string) => `${USER_GAMES_KEY}:${userId}`;

interface StoredAuthSession {
  mode?: 'backend' | 'local';
  token?: string;
  user?: { id?: string; username?: string; authMode?: 'backend' | 'local'; token?: string };
}

function readGames(userId: string): UserGame[] {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    return raw ? (JSON.parse(raw) as UserGame[]) : [];
  } catch {
    return [];
  }
}

function writeGames(userId: string, games: UserGame[]): UserGame[] {
  localStorage.setItem(storageKey(userId), JSON.stringify(games));
  return games;
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

function globalFavoriteIdForGame(game: UserGame): string {
  return `games:game:${game.source}:${game.externalId}`;
}

function syncGameFavorite(userId: string, game: UserGame): void {
  const favoriteId = globalFavoriteIdForGame(game);
  if (game.isFavorite) {
    addGlobalFavorite(userId, {
      id: favoriteId,
      vault: 'games',
      type: 'game',
      source: game.source,
      externalId: game.externalId,
      title: game.title,
      thumbnailUrl: game.coverUrl,
      metadata: {
        platforms: game.platforms,
        status: game.personalStatus,
        releaseDate: game.releaseDate,
      },
    });
    return;
  }

  const existing = getGlobalFavorites(userId).find((favorite) => favorite.id === favoriteId);
  if (existing) removeGlobalFavorite(userId, favoriteId);
  removeBackendGameFavorite(game);
}

function removeBackendGameFavorite(game: UserGame): void {
  if (!hasBackendSession()) return;
  void getBackendFavorites()
    .then((response) => {
      const favorites = (response as { favorites?: Array<{ id: string; vault: string; type: string; source?: string; externalId?: string }> }).favorites || [];
      const match = favorites.find(
        (favorite) =>
          favorite.vault === 'games' &&
          favorite.type === 'game' &&
          favorite.source === game.source &&
          favorite.externalId === game.externalId,
      );
      if (match) return removeBackendFavorite(match.id);
      return undefined;
    })
    .catch(() => undefined);
}

function replaceStoredGame(userId: string, previous: UserGame, next: UserGame): UserGame[] {
  const games = getUserGames(userId);
  const withoutPrevious = games.filter(
    (entry) =>
      entry.id !== previous.id &&
      !(entry.source === previous.source && entry.externalId === previous.externalId),
  );
  return writeGames(userId, [next, ...withoutPrevious]);
}

async function resolveBackendGameId(game: UserGame): Promise<string | null> {
  const backendGames = await getBackendUserGames();
  return backendGames.find(
    (entry) =>
      entry.id === game.id ||
      (entry.source === game.source && entry.externalId === game.externalId),
  )?.id || null;
}

export function rawgGameToUserGame(
  userId: string,
  game: RawgGame,
  status: GamePersonalStatus = 'wishlist',
  favorite = false,
  existing?: UserGame | null,
): UserGame {
  const timestamp = now();
  return {
    id: existing?.id || `rawg-${game.id}`,
    userId,
    source: 'rawg',
    externalId: String(game.id),
    title: game.name,
    coverUrl: game.backgroundImage || game.background_image,
    platforms: game.platforms.map((platform) => platform.name),
    selectedPlatform: existing?.selectedPlatform || game.platforms[0]?.name,
    releaseDate: game.released,
    personalStatus: existing?.personalStatus || status,
    isFavorite: favorite || existing?.isFavorite || false,
    notes: existing?.notes,
    metadata: {
      ...(existing?.metadata || {}),
      rating: game.rating,
      metacritic: game.metacritic,
      genres: game.genres.map((genre) => genre.name),
    },
    createdAt: existing?.createdAt || timestamp,
    updatedAt: timestamp,
  };
}

export function getUserGames(userId: string): UserGame[] {
  return readGames(userId);
}

export async function loadUserGames(userId: string): Promise<{ games: UserGame[]; storage: 'backend' | 'local'; warning?: string }> {
  if (getAccountMode() !== 'backend') {
    return { games: getUserGames(userId), storage: 'local' };
  }
  if (!getAuthToken()) return { games: getUserGames(userId), storage: 'local', warning: 'Missing auth token. Please login again.' };

  try {
    const games = await getBackendUserGames();
    writeGames(userId, games);
    return { games, storage: 'backend' };
  } catch (error) {
    const fallback = getUserGames(userId);
    return {
      games: fallback,
      storage: 'local',
      warning: backendFallbackWarning(error, 'Games'),
    };
  }
}

export function getUserGameByExternalId(
  userId: string,
  source: UserGame['source'],
  externalId: string,
): UserGame | null {
  return getUserGames(userId).find((game) => game.source === source && game.externalId === externalId) || null;
}

export function saveUserGame(userId: string, game: UserGame): UserGame {
  const updatedGame = { ...game, userId, updatedAt: now() };
  const games = getUserGames(userId);
  const nextGames = games.some((entry) => entry.id === updatedGame.id)
    ? games.map((entry) => (entry.id === updatedGame.id ? updatedGame : entry))
    : [updatedGame, ...games];
  writeGames(userId, nextGames);
  syncGameFavorite(userId, updatedGame);
  return updatedGame;
}

export async function saveUserGameHybrid(userId: string, game: UserGame): Promise<{ game: UserGame; storage: 'backend' | 'local'; warning?: string }> {
  const localGame = saveUserGame(userId, game);
  if (!hasBackendSession()) return { game: localGame, storage: 'local' };

  try {
    const backendGame = await createBackendUserGame(localGame);
    replaceStoredGame(userId, localGame, backendGame);
    syncGameFavorite(userId, backendGame);
    return { game: backendGame, storage: 'backend' };
  } catch (error) {
    return {
      game: localGame,
      storage: 'local',
      warning: error instanceof ApiNetworkError
        ? 'Backend is offline. Changes may use local fallback.'
        : 'Game could not be saved to backend. Kept local fallback.',
    };
  }
}

export function updateUserGame(userId: string, gameId: string, patch: Partial<UserGame>): UserGame {
  const existing = getUserGames(userId).find((game) => game.id === gameId);
  if (!existing) throw new Error('Game not found in library.');
  return saveUserGame(userId, { ...existing, ...patch, id: existing.id, userId });
}

export async function updateUserGameHybrid(
  userId: string,
  gameId: string,
  patch: Partial<UserGame>,
): Promise<{ game: UserGame; storage: 'backend' | 'local'; warning?: string }> {
  const updated = updateUserGame(userId, gameId, patch);
  if (!hasBackendSession()) return { game: updated, storage: 'local' };

  try {
    const backendGame = await createBackendUserGame(updated);
    replaceStoredGame(userId, updated, backendGame);
    syncGameFavorite(userId, backendGame);
    return { game: backendGame, storage: 'backend' };
  } catch (error) {
    return {
      game: updated,
      storage: 'local',
      warning: error instanceof ApiNetworkError
        ? 'Backend is offline. Changes may use local fallback.'
        : 'Game could not be updated in backend. Kept local fallback.',
    };
  }
}

export function deleteUserGame(userId: string, gameId: string): void {
  const game = getUserGames(userId).find((entry) => entry.id === gameId);
  writeGames(userId, getUserGames(userId).filter((entry) => entry.id !== gameId));
  if (game) {
    removeGlobalFavorite(userId, globalFavoriteIdForGame(game));
    removeBackendGameFavorite(game);
  }
}

export async function deleteUserGameHybrid(userId: string, gameId: string): Promise<{ storage: 'backend' | 'local'; warning?: string }> {
  const game = getUserGames(userId).find((entry) => entry.id === gameId);
  deleteUserGame(userId, gameId);

  if (!game || !hasBackendSession()) return { storage: 'local' };

  try {
    const backendId = await resolveBackendGameId(game);
    if (backendId) await deleteBackendUserGame(backendId);
    return { storage: 'backend' };
  } catch (error) {
    return {
      storage: 'local',
      warning: error instanceof ApiNetworkError
        ? 'Backend is offline. Changes may use local fallback.'
        : 'Game was removed locally, but backend removal could not be confirmed.',
    };
  }
}

export function toggleUserGameFavorite(userId: string, gameId: string): UserGame {
  const existing = getUserGames(userId).find((game) => game.id === gameId);
  if (!existing) throw new Error('Game not found in library.');
  return saveUserGame(userId, { ...existing, isFavorite: !existing.isFavorite });
}

export async function toggleUserGameFavoriteHybrid(userId: string, gameId: string): Promise<{ game: UserGame; storage: 'backend' | 'local'; warning?: string }> {
  const existing = getUserGames(userId).find((game) => game.id === gameId);
  if (!existing) throw new Error('Game not found in library.');
  return updateUserGameHybrid(userId, gameId, { isFavorite: !existing.isFavorite });
}

export function updateUserGameStatus(userId: string, gameId: string, status: GamePersonalStatus): UserGame {
  return updateUserGame(userId, gameId, { personalStatus: status });
}

export async function updateUserGameStatusHybrid(
  userId: string,
  gameId: string,
  status: GamePersonalStatus,
): Promise<{ game: UserGame; storage: 'backend' | 'local'; warning?: string }> {
  return updateUserGameHybrid(userId, gameId, { personalStatus: status });
}

export function updateUserGameNotes(userId: string, gameId: string, notes: string): UserGame {
  return updateUserGame(userId, gameId, { notes });
}

export async function updateUserGameNotesHybrid(
  userId: string,
  gameId: string,
  notes: string,
): Promise<{ game: UserGame; storage: 'backend' | 'local'; warning?: string }> {
  return updateUserGameHybrid(userId, gameId, { notes });
}

export function getUserGameStats(userId: string): GameLibraryStats {
  const games = getUserGames(userId);
  return {
    total: games.length,
    neverPlayed: games.filter((game) => game.personalStatus === 'never_played').length,
    planToPlay: games.filter((game) => game.personalStatus === 'plan_to_play').length,
    wishlist: games.filter((game) => game.personalStatus === 'wishlist').length,
    playing: games.filter((game) => game.personalStatus === 'playing').length,
    finished: games.filter((game) => game.personalStatus === 'finished').length,
    completed: games.filter((game) => game.personalStatus === 'completed').length,
    platinum: games.filter((game) => game.personalStatus === 'platinum').length,
    favorites: games.filter((game) => game.isFavorite).length,
  };
}
