import type {
  DndApiListResponse,
  DndClass,
  DndCondition,
  DndEquipment,
  DndMonster,
  DndRace,
  DndRule,
  DndSpell,
} from '../types/rpg.types';
import { getApiBaseUrl } from '../../../shared/services/apiClient';

const DND_BASE_URL = 'https://www.dnd5eapi.co/api';
const API_BASE_URL = getApiBaseUrl();
const cache = new Map<string, unknown>();

const proxyPaths = new Set([
  '/classes',
  '/races',
  '/spells',
  '/monsters',
  '/equipment',
  '/rules',
  '/conditions',
]);

function toProxyPath(path: string): string | null {
  const [basePath, query = ''] = path.split('?');
  const segments = basePath.split('/').filter(Boolean);
  const root = `/${segments[0] || ''}`;
  if (!proxyPaths.has(root)) return null;
  if (segments.length > 2) return null;
  return `/external/dnd5e${basePath}${query ? `?${query}` : ''}`;
}

async function dndFetch<T>(path: string, timeoutMs = 12000): Promise<T> {
  const proxyPath = toProxyPath(path);
  const url = proxyPath ? `${API_BASE_URL}${proxyPath}` : `${DND_BASE_URL}${path}`;
  const cached = cache.get(url);
  if (cached) return cached as T;

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    try {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) throw new Error('D&D 5e API request failed.');
      const payload = (await response.json()) as T;
      cache.set(url, payload);
      return payload;
    } catch (error) {
      if (!proxyPath) throw error;
      const directUrl = `${DND_BASE_URL}${path}`;
      const directResponse = await fetch(directUrl, { signal: controller.signal });
      if (!directResponse.ok) throw new Error('D&D 5e API request failed.');
      const payload = (await directResponse.json()) as T;
      cache.set(directUrl, payload);
      return payload;
    }
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export const getApiIndex = () => dndFetch<Record<string, string>>('');
export const getClasses = () => dndFetch<DndApiListResponse>('/classes');
export const getClassByIndex = (index: string) => dndFetch<DndClass>(`/classes/${index}`);
export const getRaces = () => dndFetch<DndApiListResponse>('/races');
export const getRaceByIndex = (index: string) => dndFetch<DndRace>(`/races/${index}`);
export const getSubclasses = () => dndFetch<DndApiListResponse>('/subclasses');
export const getSpells = (level?: string | number) => dndFetch<DndApiListResponse>(level === undefined || level === 'all' ? '/spells' : `/spells?level=${level}`);
export const getSpellByIndex = (index: string) => dndFetch<DndSpell>(`/spells/${index}`);
export const getMonsters = () => dndFetch<DndApiListResponse>('/monsters');
export const getMonsterByIndex = (index: string) => dndFetch<DndMonster>(`/monsters/${index}`);
export const getEquipment = () => dndFetch<DndApiListResponse>('/equipment');
export const getEquipmentByIndex = (index: string) => dndFetch<DndEquipment>(`/equipment/${index}`);
export const getRules = () => dndFetch<DndApiListResponse>('/rules');
export const getRuleByIndex = (index: string) => dndFetch<DndRule>(`/rules/${index}`);
export const getFeatures = () => dndFetch<DndApiListResponse>('/features');
export const getFeats = () => dndFetch<DndApiListResponse>('/feats');
export const getTraits = () => dndFetch<DndApiListResponse>('/traits');
export const getConditions = () => dndFetch<DndApiListResponse>('/conditions');
export const getConditionByIndex = (index: string) => dndFetch<DndCondition>(`/conditions/${index}`);

export async function searchSpells(query: string): Promise<DndApiListResponse> {
  const spells = await getSpells();
  const normalized = query.trim().toLowerCase();
  const results = normalized ? spells.results.filter((spell) => spell.name.toLowerCase().includes(normalized)) : spells.results;
  return {
    count: results.length,
    results,
  };
}

export async function searchMonsters(query: string): Promise<DndApiListResponse> {
  const monsters = await getMonsters();
  const normalized = query.trim().toLowerCase();
  const results = normalized ? monsters.results.filter((monster) => monster.name.toLowerCase().includes(normalized)) : monsters.results;
  return {
    count: results.length,
    results,
  };
}
