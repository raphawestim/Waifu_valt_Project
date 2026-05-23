import type { CardSearchFilters, ScryfallCard } from '../types/tcg.types';
import { getApiBaseUrl } from '../../../shared/services/apiClient';

const SCRYFALL_BASE_URL = 'https://api.scryfall.com';
const API_BASE_URL = getApiBaseUrl();
const searchCache = new Map<string, ScryfallCard[]>();

interface ScryfallListResponse {
  data?: ScryfallCard[];
  has_more?: boolean;
  next_page?: string;
  details?: string;
}

interface ScryfallSetResponse {
  data?: Array<{ code: string; name: string; released_at?: string }>;
}

function buildSearchQuery(query: string, filters: CardSearchFilters = {}): string {
  const clauses = [query.trim() || '*'];
  if (filters.color) clauses.push(`c:${filters.color}`);
  if (filters.type) clauses.push(`t:${filters.type}`);
  if (filters.rarity) clauses.push(`r:${filters.rarity}`);
  if (filters.set) clauses.push(`set:${filters.set}`);
  if (filters.manaValue) clauses.push(`mv=${filters.manaValue}`);
  if (filters.format) clauses.push(`legal:${filters.format}`);
  return clauses.filter(Boolean).join(' ');
}

async function fetchScryfall<T>(url: string, timeoutMs = 12000): Promise<T> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    const payload = (await response.json()) as T & { details?: string };
    if (!response.ok) throw new Error(payload.details || 'Scryfall request failed.');
    return payload;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

async function fetchProxy<T>(path: string, timeoutMs = 12000): Promise<T> {
  const response = await fetchScryfall<T & { details?: string; message?: string }>(`${API_BASE_URL}${path}`, timeoutMs);
  return response as T;
}

function normalizeCard(card: ScryfallCard): ScryfallCard {
  const faceImage = (card as ScryfallCard & { card_faces?: Array<{ image_uris?: ScryfallCard['image_uris']; oracle_text?: string }> }).card_faces?.[0];
  return {
    ...card,
    oracle_text: card.oracle_text || faceImage?.oracle_text,
    image_uris: card.image_uris || faceImage?.image_uris,
  };
}

export async function searchCards(query: string, filters: CardSearchFilters = {}): Promise<ScryfallCard[]> {
  const q = buildSearchQuery(query, filters);
  const cacheKey = `${q}:page:${filters.page || 1}`.toLowerCase();
  const cached = searchCache.get(cacheKey);
  if (cached) return cached;

  const url = new URL(`${SCRYFALL_BASE_URL}/cards/search`);
  url.searchParams.set('q', q);
  url.searchParams.set('unique', 'cards');
  url.searchParams.set('order', filters.page ? 'name' : 'released');
  if (filters.page) url.searchParams.set('page', String(filters.page));

  let payload: ScryfallListResponse;
  try {
    const proxyUrl = new URL(`${API_BASE_URL}/external/scryfall/cards/search`);
    proxyUrl.searchParams.set('q', q);
    proxyUrl.searchParams.set('unique', 'cards');
    proxyUrl.searchParams.set('order', filters.page ? 'name' : 'released');
    if (filters.page) proxyUrl.searchParams.set('page', String(filters.page));
    payload = await fetchProxy<ScryfallListResponse>(`${proxyUrl.pathname}${proxyUrl.search}`);
  } catch {
    payload = await fetchScryfall<ScryfallListResponse>(url.toString());
  }
  const results = (payload.data || []).slice(0, 24).map(normalizeCard);
  searchCache.set(cacheKey, results);
  return results;
}

export async function getRandomCards(count = 8): Promise<ScryfallCard[]> {
  const results: ScryfallCard[] = [];
  for (let index = 0; index < count; index += 1) {
    let card: ScryfallCard;
    try {
      card = await fetchProxy<ScryfallCard>('/external/scryfall/cards/random', 8000);
    } catch {
      card = await fetchScryfall<ScryfallCard>(`${SCRYFALL_BASE_URL}/cards/random`, 8000);
    }
    results.push(normalizeCard(card));
  }
  return results;
}

export async function getLatestCards(): Promise<ScryfallCard[]> {
  try {
    return await searchCards('game:paper', {});
  } catch {
    return getRandomCards(8);
  }
}

export async function getCardById(id: string): Promise<ScryfallCard> {
  try {
    return normalizeCard(await fetchProxy<ScryfallCard>(`/external/scryfall/cards/${id}`));
  } catch {
    return normalizeCard(await fetchScryfall<ScryfallCard>(`${SCRYFALL_BASE_URL}/cards/${id}`));
  }
}

export async function getSets(): Promise<Array<{ code: string; name: string; released_at?: string }>> {
  let payload: ScryfallSetResponse;
  try {
    payload = await fetchProxy<ScryfallSetResponse>('/external/scryfall/sets');
  } catch {
    payload = await fetchScryfall<ScryfallSetResponse>(`${SCRYFALL_BASE_URL}/sets`);
  }
  return payload.data || [];
}

export async function getCardsBySet(setCode: string): Promise<ScryfallCard[]> {
  return searchCards(`set:${setCode}`);
}

export const searchScryfallCards = searchCards;
export const getFeaturedScryfallCards = getLatestCards;
