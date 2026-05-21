import type { ScryfallSearchResult } from '../types/games.types';

interface ScryfallCardApiResponse {
  id: string;
  name: string;
  type_line?: string;
  oracle_text?: string;
  scryfall_uri: string;
  set_name?: string;
  rarity?: string;
  image_uris?: {
    normal?: string;
    small?: string;
  };
  card_faces?: Array<{
    oracle_text?: string;
    image_uris?: {
      normal?: string;
      small?: string;
    };
  }>;
}

interface ScryfallSearchApiResponse {
  data?: ScryfallCardApiResponse[];
  details?: string;
}

const scryfallSearchCache = new Map<string, ScryfallSearchResult[]>();

export async function searchScryfallCards(query: string): Promise<ScryfallSearchResult[]> {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) return [];
  const cacheKey = trimmedQuery.toLowerCase();
  const cachedResults = scryfallSearchCache.get(cacheKey);
  if (cachedResults) return cachedResults;

  const response = await fetch(
    `https://api.scryfall.com/cards/search?q=${encodeURIComponent(trimmedQuery)}&unique=cards&order=name`,
  );
  const payload = (await response.json()) as ScryfallSearchApiResponse;

  if (!response.ok) {
    throw new Error(payload.details || 'Scryfall search failed.');
  }

  const results = (payload.data || []).slice(0, 8).map((card) => ({
    id: card.id,
    name: card.name,
    typeLine: card.type_line || 'Magic card',
    oracleText: card.oracle_text || card.card_faces?.[0]?.oracle_text,
    imageUrl: card.image_uris?.normal || card.card_faces?.[0]?.image_uris?.normal || card.image_uris?.small,
    setName: card.set_name,
    rarity: card.rarity,
    sourceUrl: card.scryfall_uri,
  }));
  scryfallSearchCache.set(cacheKey, results);
  return results;
}

export async function getFeaturedScryfallCards(): Promise<ScryfallSearchResult[]> {
  return searchScryfallCards('game:paper legal:commander unique:cards');
}
