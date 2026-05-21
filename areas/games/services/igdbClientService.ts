export interface IgdbGame {
  id: number;
  name: string;
  slug?: string;
  summary?: string;
  url?: string;
  total_rating?: number;
  first_release_date?: number;
  cover?: {
    url?: string;
  };
  genres?: Array<{ name: string }>;
  platforms?: Array<{ name: string }>;
}

export async function searchIgdbGames(query: string): Promise<IgdbGame[]> {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) return [];

  const response = await fetch(`/api/igdb/search-games?q=${encodeURIComponent(trimmedQuery)}`);
  if (response.status === 501) return [];
  if (!response.ok) throw new Error('IGDB bridge request failed.');
  return (await response.json()) as IgdbGame[];
}

export async function getIgdbGame(gameId: number | string): Promise<IgdbGame | null> {
  const response = await fetch(`/api/igdb/game/${gameId}`);
  if (response.status === 501) return null;
  if (!response.ok) throw new Error('IGDB bridge request failed.');
  const payload = (await response.json()) as IgdbGame[];
  return payload[0] || null;
}
