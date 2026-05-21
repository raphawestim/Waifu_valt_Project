import type {
  DndApiListResponse,
  DndClass,
  DndEquipment,
  DndMonster,
  DndRace,
  DndRule,
  DndSpell,
} from '../types/rpg.types';

const DND_BASE_URL = 'https://www.dnd5eapi.co/api';
const cache = new Map<string, unknown>();

async function dndFetch<T>(path: string): Promise<T> {
  const url = `${DND_BASE_URL}${path}`;
  const cached = cache.get(url);
  if (cached) return cached as T;

  const response = await fetch(url);
  if (!response.ok) throw new Error('D&D 5e API request failed.');
  const payload = (await response.json()) as T;
  cache.set(url, payload);
  return payload;
}

export const getApiIndex = () => dndFetch<Record<string, string>>('');
export const getClasses = () => dndFetch<DndApiListResponse>('/classes');
export const getClassByIndex = (index: string) => dndFetch<DndClass>(`/classes/${index}`);
export const getRaces = () => dndFetch<DndApiListResponse>('/races');
export const getRaceByIndex = (index: string) => dndFetch<DndRace>(`/races/${index}`);
export const getSubclasses = () => dndFetch<DndApiListResponse>('/subclasses');
export const getSpells = () => dndFetch<DndApiListResponse>('/spells');
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

export async function searchSpells(query: string): Promise<DndApiListResponse> {
  const spells = await getSpells();
  const normalized = query.trim().toLowerCase();
  return {
    count: spells.results.length,
    results: normalized ? spells.results.filter((spell) => spell.name.toLowerCase().includes(normalized)) : spells.results,
  };
}

export async function searchMonsters(query: string): Promise<DndApiListResponse> {
  const monsters = await getMonsters();
  const normalized = query.trim().toLowerCase();
  return {
    count: monsters.results.length,
    results: normalized ? monsters.results.filter((monster) => monster.name.toLowerCase().includes(normalized)) : monsters.results,
  };
}
