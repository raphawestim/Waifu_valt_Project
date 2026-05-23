import { apiDelete, apiGet, apiPatch, apiPost } from '../../../shared/services/apiClient';
import type { UserGame } from '../types/games.types';

type UserGamePayload = Omit<UserGame, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;

export async function getBackendUserGames(): Promise<UserGame[]> {
  const response = await apiGet<{ games: UserGame[] }>('/me/games');
  return response.games;
}

export async function createBackendUserGame(game: UserGame): Promise<UserGame> {
  const { id: _id, userId: _userId, createdAt: _createdAt, updatedAt: _updatedAt, ...payload } = game;
  const response = await apiPost<{ game: UserGame }>('/me/games', payload satisfies UserGamePayload);
  return response.game;
}

export async function updateBackendUserGame(gameId: string, patch: Partial<UserGame>): Promise<UserGame> {
  const { id: _id, userId: _userId, createdAt: _createdAt, updatedAt: _updatedAt, ...payload } = patch;
  const response = await apiPatch<{ game: UserGame }>(`/me/games/${gameId}`, payload);
  return response.game;
}

export async function deleteBackendUserGame(gameId: string): Promise<void> {
  await apiDelete(`/me/games/${gameId}`);
}
