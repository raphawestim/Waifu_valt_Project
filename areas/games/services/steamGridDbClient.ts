import { apiGet } from '../../../shared/services/apiClient';
import type { SteamGridDbArtwork, SteamGridDbGame } from '../types/games.types';

interface SteamGridDbResponse<T> {
  success?: boolean;
  data?: T;
  message?: string;
}

function unwrap<T>(response: SteamGridDbResponse<T>, fallback: T): T {
  return response.data ?? fallback;
}

export async function searchSteamGridDbGames(query: string): Promise<SteamGridDbGame[]> {
  const response = await apiGet<SteamGridDbResponse<SteamGridDbGame[]>>(`/external/steamgriddb/search?q=${encodeURIComponent(query)}`);
  return unwrap(response, []);
}

export async function getSteamGridDbGame(gameId: string | number): Promise<SteamGridDbGame | null> {
  const response = await apiGet<SteamGridDbResponse<SteamGridDbGame>>(`/external/steamgriddb/games/${gameId}`);
  return unwrap(response, null as SteamGridDbGame | null);
}

export async function getSteamGridDbGrids(gameId: string | number): Promise<SteamGridDbArtwork[]> {
  const response = await apiGet<SteamGridDbResponse<SteamGridDbArtwork[]>>(`/external/steamgriddb/games/${gameId}/grids`);
  return unwrap(response, []);
}

export async function getSteamGridDbHeroes(gameId: string | number): Promise<SteamGridDbArtwork[]> {
  const response = await apiGet<SteamGridDbResponse<SteamGridDbArtwork[]>>(`/external/steamgriddb/games/${gameId}/heroes`);
  return unwrap(response, []);
}

export async function getSteamGridDbLogos(gameId: string | number): Promise<SteamGridDbArtwork[]> {
  const response = await apiGet<SteamGridDbResponse<SteamGridDbArtwork[]>>(`/external/steamgriddb/games/${gameId}/logos`);
  return unwrap(response, []);
}

export async function getSteamGridDbIcons(gameId: string | number): Promise<SteamGridDbArtwork[]> {
  const response = await apiGet<SteamGridDbResponse<SteamGridDbArtwork[]>>(`/external/steamgriddb/games/${gameId}/icons`);
  return unwrap(response, []);
}
