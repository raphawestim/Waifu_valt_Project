import { apiGet } from '../../../shared/services/apiClient';
import type { SteamAppSearchResult } from '../types/games.types';

export async function searchSteamApps(query: string): Promise<SteamAppSearchResult[]> {
  const response = await apiGet<{ apps: SteamAppSearchResult[] }>(`/external/steam/search?q=${encodeURIComponent(query)}`);
  return response.apps || [];
}

export async function getSteamAppDetails(appId: string | number): Promise<Record<string, unknown>> {
  return apiGet<Record<string, unknown>>(`/external/steam/apps/${appId}`);
}

export async function getSteamStoreUrl(appId: string | number): Promise<{ appId: string; storeUrl: string }> {
  return apiGet<{ appId: string; storeUrl: string }>(`/external/steam/apps/${appId}/store-url`);
}
