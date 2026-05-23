import {
  addGlobalFavorite,
  getGlobalFavorites,
  removeGlobalFavorite,
} from '../../../services/userProfileService';
import { ApiHttpError, ApiNetworkError, checkApiHealth, getAuthToken } from '../../../shared/services/apiClient';
import { getBackendFavorites, removeBackendFavorite } from '../../../shared/services/favoritesClient';
import {
  createBackendCampaign,
  createBackendCampaignSession,
  createBackendRpgCharacter,
  deleteBackendCampaign,
  deleteBackendCampaignSession,
  deleteBackendRpgCharacter,
  getBackendCampaigns,
  getBackendCampaignSessions,
  getBackendRpgCharacters,
  updateBackendCampaign,
  updateBackendCampaignSession,
  updateBackendRpgCharacter,
} from './rpgClient';
import type { CampaignSession, UserCampaign, UserRpgCharacter } from '../types/rpg.types';

const CHARACTERS_KEY = 'thevault.userRpgCharacters';
const CAMPAIGNS_KEY = 'thevault.userRpgCampaigns';
const SESSIONS_KEY = 'thevault.userRpgSessions';
const AUTH_SESSION_KEY = 'thevault.auth.session';

const defaultAttributes = {
  strength: 10,
  dexterity: 10,
  constitution: 10,
  intelligence: 10,
  wisdom: 10,
  charisma: 10,
};

const now = () => new Date().toISOString();
const makeId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
const key = (base: string, userId: string) => `${base}:${userId}`;

interface StoredAuthSession {
  mode?: 'backend' | 'local';
  token?: string;
  user?: { id?: string; username?: string; authMode?: 'backend' | 'local'; token?: string };
}

export interface RpgStats {
  totalCharacters: number;
  favoriteCharacters: number;
  totalCampaigns: number;
  favoriteCampaigns: number;
  totalSessions: number;
}

function readItems<T>(base: string, userId: string): T[] {
  try {
    const raw = localStorage.getItem(key(base, userId));
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function writeItems<T>(base: string, userId: string, items: T[]): T[] {
  localStorage.setItem(key(base, userId), JSON.stringify(items));
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

function normalizeCharacter(userId: string, character: UserRpgCharacter): UserRpgCharacter {
  return {
    ...character,
    userId,
    level: character.level || 1,
    attributes: character.attributes || defaultAttributes,
    notes: character.notes || '',
    isFavorite: Boolean(character.isFavorite),
    createdAt: character.createdAt || now(),
    updatedAt: character.updatedAt || now(),
  };
}

function normalizeCampaign(userId: string, campaign: UserCampaign): UserCampaign {
  return {
    ...campaign,
    userId,
    system: campaign.system || 'dnd5e',
    characterIds: campaign.characterIds || [],
    notes: campaign.notes || '',
    isFavorite: Boolean(campaign.isFavorite),
    createdAt: campaign.createdAt || now(),
    updatedAt: campaign.updatedAt || now(),
  };
}

function normalizeSession(userId: string, campaignId: string, session: CampaignSession): CampaignSession {
  return {
    ...session,
    userId,
    campaignId,
    summary: session.summary || '',
    notes: session.notes || '',
    createdAt: session.createdAt || now(),
    updatedAt: session.updatedAt || now(),
  };
}

function upsert<T extends { id: string; updatedAt: string }>(items: T[], item: T): T[] {
  const updated = { ...item, updatedAt: now() };
  return items.some((entry) => entry.id === item.id)
    ? items.map((entry) => (entry.id === item.id ? updated : entry))
    : [updated, ...items];
}

function characterFavoriteId(character: UserRpgCharacter) {
  return `rpg:character:local:${character.id}`;
}

function campaignFavoriteId(campaign: UserCampaign) {
  return `rpg:campaign:local:${campaign.id}`;
}

function removeBackendRpgFavorite(type: 'character' | 'campaign', externalId: string): void {
  if (!hasBackendSession()) return;
  void getBackendFavorites()
    .then((response) => {
      const favorites = (response as { favorites?: Array<{ id: string; vault: string; type: string; source?: string; externalId?: string }> }).favorites || [];
      const match = favorites.find(
        (favorite) =>
          favorite.vault === 'rpg' &&
          favorite.type === type &&
          favorite.source === 'local' &&
          favorite.externalId === externalId,
      );
      if (match) return removeBackendFavorite(match.id);
      return undefined;
    })
    .catch(() => undefined);
}

function syncCharacterFavorite(userId: string, character: UserRpgCharacter) {
  const id = characterFavoriteId(character);
  if (character.isFavorite) {
    addGlobalFavorite(userId, {
      id,
      vault: 'rpg',
      type: 'character',
      source: 'local',
      externalId: character.id,
      title: character.name,
      metadata: { level: character.level, raceName: character.raceName, className: character.className },
    });
    return;
  }
  if (getGlobalFavorites(userId).some((favorite) => favorite.id === id)) removeGlobalFavorite(userId, id);
  removeBackendRpgFavorite('character', character.id);
}

function syncCampaignFavorite(userId: string, campaign: UserCampaign) {
  const id = campaignFavoriteId(campaign);
  if (campaign.isFavorite) {
    addGlobalFavorite(userId, {
      id,
      vault: 'rpg',
      type: 'campaign',
      source: 'local',
      externalId: campaign.id,
      title: campaign.name,
      metadata: { system: campaign.system, tone: campaign.tone, world: campaign.world },
    });
    return;
  }
  if (getGlobalFavorites(userId).some((favorite) => favorite.id === id)) removeGlobalFavorite(userId, id);
  removeBackendRpgFavorite('campaign', campaign.id);
}

function replaceStoredCharacter(userId: string, previous: UserRpgCharacter, next: UserRpgCharacter): UserRpgCharacter[] {
  const characters = getUserRpgCharacters(userId);
  const withoutPrevious = characters.filter((entry) => entry.id !== previous.id);
  return writeItems(CHARACTERS_KEY, userId, [normalizeCharacter(userId, next), ...withoutPrevious]);
}

function replaceStoredCampaign(userId: string, previous: UserCampaign, next: UserCampaign): UserCampaign[] {
  const campaigns = getUserCampaigns(userId);
  const withoutPrevious = campaigns.filter((entry) => entry.id !== previous.id);
  return writeItems(CAMPAIGNS_KEY, userId, [normalizeCampaign(userId, next), ...withoutPrevious]);
}

function replaceStoredSession(userId: string, previous: CampaignSession, next: CampaignSession): CampaignSession[] {
  const sessions = getAllCampaignSessions(userId);
  const normalized = normalizeSession(userId, next.campaignId, next);
  const withoutPrevious = sessions.filter((entry) => entry.id !== previous.id);
  return writeItems(SESSIONS_KEY, userId, [normalized, ...withoutPrevious]);
}

async function resolveBackendCharacterId(character: UserRpgCharacter): Promise<string | null> {
  const characters = await getBackendRpgCharacters();
  return characters.find((entry) => entry.id === character.id)?.id || null;
}

async function resolveBackendCampaignId(campaign: UserCampaign): Promise<string | null> {
  const campaigns = await getBackendCampaigns();
  return campaigns.find((entry) => entry.id === campaign.id)?.id || null;
}

export function getUserRpgCharacters(userId: string): UserRpgCharacter[] {
  return readItems<UserRpgCharacter>(CHARACTERS_KEY, userId).map((character) => normalizeCharacter(userId, character));
}

export async function loadUserRpgCharacters(userId: string): Promise<{ characters: UserRpgCharacter[]; storage: 'backend' | 'local'; warning?: string }> {
  if (getAccountMode() !== 'backend') return { characters: getUserRpgCharacters(userId), storage: 'local' };
  if (!getAuthToken()) return { characters: getUserRpgCharacters(userId), storage: 'local', warning: 'Missing auth token. Please login again.' };

  try {
    const characters = (await getBackendRpgCharacters()).map((character) => normalizeCharacter(userId, character));
    writeItems(CHARACTERS_KEY, userId, characters);
    return { characters, storage: 'backend' };
  } catch (error) {
    return { characters: getUserRpgCharacters(userId), storage: 'local', warning: backendFallbackWarning(error, 'RPG characters') };
  }
}

export function getUserRpgCharacter(userId: string, characterId: string): UserRpgCharacter | null {
  return getUserRpgCharacters(userId).find((character) => character.id === characterId) || null;
}

export function createUserRpgCharacter(userId: string, payload: Partial<UserRpgCharacter> = {}): UserRpgCharacter {
  const timestamp = now();
  return normalizeCharacter(userId, {
    id: payload.id || makeId('rpg-character'),
    userId,
    name: payload.name || '',
    raceIndex: payload.raceIndex,
    raceName: payload.raceName,
    classIndex: payload.classIndex,
    className: payload.className,
    level: payload.level || 1,
    background: payload.background,
    alignment: payload.alignment,
    attributes: payload.attributes || defaultAttributes,
    notes: payload.notes || '',
    isFavorite: payload.isFavorite || false,
    createdAt: payload.createdAt || timestamp,
    updatedAt: payload.updatedAt || timestamp,
  });
}

export function saveUserRpgCharacter(userId: string, character: UserRpgCharacter): UserRpgCharacter {
  const updated = normalizeCharacter(userId, { ...character, userId });
  writeItems(CHARACTERS_KEY, userId, upsert(getUserRpgCharacters(userId), updated));
  syncCharacterFavorite(userId, updated);
  return updated;
}

export async function saveUserRpgCharacterHybrid(
  userId: string,
  character: UserRpgCharacter,
): Promise<{ character: UserRpgCharacter; storage: 'backend' | 'local'; warning?: string }> {
  const localCharacter = saveUserRpgCharacter(userId, character);
  if (!hasBackendSession()) return { character: localCharacter, storage: 'local' };

  try {
    const backendId = await resolveBackendCharacterId(localCharacter);
    const backendCharacter = backendId
      ? await updateBackendRpgCharacter(backendId, {
        name: localCharacter.name,
        raceIndex: localCharacter.raceIndex,
        raceName: localCharacter.raceName,
        classIndex: localCharacter.classIndex,
        className: localCharacter.className,
        level: localCharacter.level,
        background: localCharacter.background,
        alignment: localCharacter.alignment,
        attributes: localCharacter.attributes,
        notes: localCharacter.notes || '',
        isFavorite: localCharacter.isFavorite,
      })
      : await createBackendRpgCharacter(localCharacter);
    if (localCharacter.id !== backendCharacter.id) {
      removeGlobalFavorite(userId, characterFavoriteId(localCharacter));
      removeBackendRpgFavorite('character', localCharacter.id);
    }
    replaceStoredCharacter(userId, localCharacter, backendCharacter);
    syncCharacterFavorite(userId, backendCharacter);
    return { character: normalizeCharacter(userId, backendCharacter), storage: 'backend' };
  } catch (error) {
    return {
      character: localCharacter,
      storage: 'local',
      warning: error instanceof ApiNetworkError
        ? 'Backend is offline. Changes may use local fallback.'
        : 'RPG character could not be saved to backend. Kept local fallback.',
    };
  }
}

export function updateUserRpgCharacter(userId: string, characterId: string, patch: Partial<UserRpgCharacter>): UserRpgCharacter {
  const character = getUserRpgCharacter(userId, characterId);
  if (!character) throw new Error('Character not found.');
  return saveUserRpgCharacter(userId, { ...character, ...patch, id: character.id, userId });
}

export async function updateUserRpgCharacterHybrid(
  userId: string,
  characterId: string,
  patch: Partial<UserRpgCharacter>,
): Promise<{ character: UserRpgCharacter; storage: 'backend' | 'local'; warning?: string }> {
  const updated = updateUserRpgCharacter(userId, characterId, patch);
  return saveUserRpgCharacterHybrid(userId, updated);
}

export function deleteUserRpgCharacter(userId: string, characterId: string): void {
  const character = getUserRpgCharacter(userId, characterId);
  writeItems(CHARACTERS_KEY, userId, getUserRpgCharacters(userId).filter((entry) => entry.id !== characterId));
  if (character) {
    removeGlobalFavorite(userId, characterFavoriteId(character));
    removeBackendRpgFavorite('character', character.id);
  }
}

export async function deleteUserRpgCharacterHybrid(userId: string, characterId: string): Promise<{ storage: 'backend' | 'local'; warning?: string }> {
  const character = getUserRpgCharacter(userId, characterId);
  deleteUserRpgCharacter(userId, characterId);
  if (!character || !hasBackendSession()) return { storage: 'local' };

  try {
    const backendId = await resolveBackendCharacterId(character);
    if (backendId) await deleteBackendRpgCharacter(backendId);
    return { storage: 'backend' };
  } catch (error) {
    return {
      storage: 'local',
      warning: error instanceof ApiNetworkError
        ? 'Backend is offline. Changes may use local fallback.'
        : 'RPG character was removed locally, but backend removal could not be confirmed.',
    };
  }
}

export function toggleRpgCharacterFavorite(userId: string, characterId: string): UserRpgCharacter {
  const character = getUserRpgCharacter(userId, characterId);
  if (!character) throw new Error('Character not found.');
  return saveUserRpgCharacter(userId, { ...character, isFavorite: !character.isFavorite });
}

export async function toggleRpgCharacterFavoriteHybrid(userId: string, characterId: string): Promise<{ character: UserRpgCharacter; storage: 'backend' | 'local'; warning?: string }> {
  const character = getUserRpgCharacter(userId, characterId);
  if (!character) throw new Error('Character not found.');
  return updateUserRpgCharacterHybrid(userId, characterId, { isFavorite: !character.isFavorite });
}

export function getUserCampaigns(userId: string): UserCampaign[] {
  return readItems<UserCampaign>(CAMPAIGNS_KEY, userId).map((campaign) => normalizeCampaign(userId, campaign));
}

export async function loadUserCampaigns(userId: string): Promise<{ campaigns: UserCampaign[]; storage: 'backend' | 'local'; warning?: string }> {
  if (getAccountMode() !== 'backend') return { campaigns: getUserCampaigns(userId), storage: 'local' };
  if (!getAuthToken()) return { campaigns: getUserCampaigns(userId), storage: 'local', warning: 'Missing auth token. Please login again.' };

  try {
    const campaigns = (await getBackendCampaigns()).map((campaign) => normalizeCampaign(userId, campaign));
    writeItems(CAMPAIGNS_KEY, userId, campaigns);
    return { campaigns, storage: 'backend' };
  } catch (error) {
    return { campaigns: getUserCampaigns(userId), storage: 'local', warning: backendFallbackWarning(error, 'RPG campaigns') };
  }
}

export function getUserCampaign(userId: string, campaignId: string): UserCampaign | null {
  return getUserCampaigns(userId).find((campaign) => campaign.id === campaignId) || null;
}

export function createUserCampaign(userId: string, payload: Partial<UserCampaign> = {}): UserCampaign {
  const timestamp = now();
  return normalizeCampaign(userId, {
    id: payload.id || makeId('campaign'),
    userId,
    name: payload.name || '',
    system: payload.system || 'dnd5e',
    tone: payload.tone,
    world: payload.world,
    description: payload.description,
    characterIds: payload.characterIds || [],
    notes: payload.notes || '',
    isFavorite: payload.isFavorite || false,
    createdAt: payload.createdAt || timestamp,
    updatedAt: payload.updatedAt || timestamp,
  });
}

export function saveUserCampaign(userId: string, campaign: UserCampaign): UserCampaign {
  const updated = normalizeCampaign(userId, { ...campaign, userId });
  writeItems(CAMPAIGNS_KEY, userId, upsert(getUserCampaigns(userId), updated));
  syncCampaignFavorite(userId, updated);
  return updated;
}

export async function saveUserCampaignHybrid(
  userId: string,
  campaign: UserCampaign,
): Promise<{ campaign: UserCampaign; storage: 'backend' | 'local'; warning?: string }> {
  const localCampaign = saveUserCampaign(userId, campaign);
  if (!hasBackendSession()) return { campaign: localCampaign, storage: 'local' };

  try {
    const backendId = await resolveBackendCampaignId(localCampaign);
    const backendCampaign = backendId
      ? await updateBackendCampaign(backendId, {
        name: localCampaign.name,
        system: localCampaign.system,
        tone: localCampaign.tone,
        world: localCampaign.world,
        description: localCampaign.description,
        characterIds: localCampaign.characterIds || [],
        notes: localCampaign.notes || '',
        isFavorite: localCampaign.isFavorite,
      })
      : await createBackendCampaign(localCampaign);
    if (localCampaign.id !== backendCampaign.id) {
      removeGlobalFavorite(userId, campaignFavoriteId(localCampaign));
      removeBackendRpgFavorite('campaign', localCampaign.id);
    }
    replaceStoredCampaign(userId, localCampaign, backendCampaign);
    syncCampaignFavorite(userId, backendCampaign);
    return { campaign: normalizeCampaign(userId, backendCampaign), storage: 'backend' };
  } catch (error) {
    return {
      campaign: localCampaign,
      storage: 'local',
      warning: error instanceof ApiNetworkError
        ? 'Backend is offline. Changes may use local fallback.'
        : 'RPG campaign could not be saved to backend. Kept local fallback.',
    };
  }
}

export function updateUserCampaign(userId: string, campaignId: string, patch: Partial<UserCampaign>): UserCampaign {
  const campaign = getUserCampaign(userId, campaignId);
  if (!campaign) throw new Error('Campaign not found.');
  return saveUserCampaign(userId, { ...campaign, ...patch, id: campaign.id, userId });
}

export async function updateUserCampaignHybrid(
  userId: string,
  campaignId: string,
  patch: Partial<UserCampaign>,
): Promise<{ campaign: UserCampaign; storage: 'backend' | 'local'; warning?: string }> {
  const updated = updateUserCampaign(userId, campaignId, patch);
  return saveUserCampaignHybrid(userId, updated);
}

export function deleteUserCampaign(userId: string, campaignId: string): void {
  const campaign = getUserCampaign(userId, campaignId);
  writeItems(CAMPAIGNS_KEY, userId, getUserCampaigns(userId).filter((entry) => entry.id !== campaignId));
  writeItems(SESSIONS_KEY, userId, getAllCampaignSessions(userId).filter((session) => session.campaignId !== campaignId));
  if (campaign) {
    removeGlobalFavorite(userId, campaignFavoriteId(campaign));
    removeBackendRpgFavorite('campaign', campaign.id);
  }
}

export async function deleteUserCampaignHybrid(userId: string, campaignId: string): Promise<{ storage: 'backend' | 'local'; warning?: string }> {
  const campaign = getUserCampaign(userId, campaignId);
  deleteUserCampaign(userId, campaignId);
  if (!campaign || !hasBackendSession()) return { storage: 'local' };

  try {
    const backendId = await resolveBackendCampaignId(campaign);
    if (backendId) await deleteBackendCampaign(backendId);
    return { storage: 'backend' };
  } catch (error) {
    return {
      storage: 'local',
      warning: error instanceof ApiNetworkError
        ? 'Backend is offline. Changes may use local fallback.'
        : 'RPG campaign was removed locally, but backend removal could not be confirmed.',
    };
  }
}

export function toggleCampaignFavorite(userId: string, campaignId: string): UserCampaign {
  const campaign = getUserCampaign(userId, campaignId);
  if (!campaign) throw new Error('Campaign not found.');
  return saveUserCampaign(userId, { ...campaign, isFavorite: !campaign.isFavorite });
}

export async function toggleCampaignFavoriteHybrid(userId: string, campaignId: string): Promise<{ campaign: UserCampaign; storage: 'backend' | 'local'; warning?: string }> {
  const campaign = getUserCampaign(userId, campaignId);
  if (!campaign) throw new Error('Campaign not found.');
  return updateUserCampaignHybrid(userId, campaignId, { isFavorite: !campaign.isFavorite });
}

export function getCampaignSessions(userId: string, campaignId: string): CampaignSession[] {
  return readItems<CampaignSession>(SESSIONS_KEY, userId)
    .filter((session) => session.campaignId === campaignId)
    .map((session) => normalizeSession(userId, campaignId, session));
}

export function getAllCampaignSessions(userId: string): CampaignSession[] {
  return readItems<CampaignSession>(SESSIONS_KEY, userId).map((session) => normalizeSession(userId, session.campaignId, session));
}

export async function loadCampaignSessions(
  userId: string,
  campaignId: string,
): Promise<{ sessions: CampaignSession[]; storage: 'backend' | 'local'; warning?: string }> {
  if (getAccountMode() !== 'backend') return { sessions: getCampaignSessions(userId, campaignId), storage: 'local' };
  if (!getAuthToken()) return { sessions: getCampaignSessions(userId, campaignId), storage: 'local', warning: 'Missing auth token. Please login again.' };

  try {
    const sessions = (await getBackendCampaignSessions(campaignId)).map((session) => normalizeSession(userId, campaignId, session));
    const otherSessions = getAllCampaignSessions(userId).filter((session) => session.campaignId !== campaignId);
    writeItems(SESSIONS_KEY, userId, [...sessions, ...otherSessions]);
    return { sessions, storage: 'backend' };
  } catch (error) {
    return { sessions: getCampaignSessions(userId, campaignId), storage: 'local', warning: backendFallbackWarning(error, 'RPG sessions') };
  }
}

export async function loadUserRpgData(userId: string): Promise<{
  characters: UserRpgCharacter[];
  campaigns: UserCampaign[];
  sessions: CampaignSession[];
  storage: 'backend' | 'local';
  warning?: string;
}> {
  if (getAccountMode() !== 'backend') {
    return {
      characters: getUserRpgCharacters(userId),
      campaigns: getUserCampaigns(userId),
      sessions: getAllCampaignSessions(userId),
      storage: 'local',
    };
  }
  if (!getAuthToken()) {
    return {
      characters: getUserRpgCharacters(userId),
      campaigns: getUserCampaigns(userId),
      sessions: getAllCampaignSessions(userId),
      storage: 'local',
      warning: 'Missing auth token. Please login again.',
    };
  }

  try {
    const [characters, campaigns] = await Promise.all([getBackendRpgCharacters(), getBackendCampaigns()]);
    const sessions = (await Promise.all(campaigns.map((campaign) => getBackendCampaignSessions(campaign.id)))).flat();
    const normalizedCharacters = characters.map((character) => normalizeCharacter(userId, character));
    const normalizedCampaigns = campaigns.map((campaign) => normalizeCampaign(userId, campaign));
    const normalizedSessions = sessions.map((session) => normalizeSession(userId, session.campaignId, session));
    writeItems(CHARACTERS_KEY, userId, normalizedCharacters);
    writeItems(CAMPAIGNS_KEY, userId, normalizedCampaigns);
    writeItems(SESSIONS_KEY, userId, normalizedSessions);
    return { characters: normalizedCharacters, campaigns: normalizedCampaigns, sessions: normalizedSessions, storage: 'backend' };
  } catch (error) {
    return {
      characters: getUserRpgCharacters(userId),
      campaigns: getUserCampaigns(userId),
      sessions: getAllCampaignSessions(userId),
      storage: 'local',
      warning: backendFallbackWarning(error, 'RPG'),
    };
  }
}

export function createCampaignSession(userId: string, campaignId: string, payload: Partial<CampaignSession>): CampaignSession {
  const timestamp = now();
  const session = normalizeSession(userId, campaignId, {
    id: payload.id || makeId('session'),
    userId,
    campaignId,
    title: payload.title || `Session ${new Date().toLocaleDateString()}`,
    summary: payload.summary || '',
    notes: payload.notes || '',
    sessionDate: payload.sessionDate,
    createdAt: payload.createdAt || timestamp,
    updatedAt: payload.updatedAt || timestamp,
  });
  writeItems(SESSIONS_KEY, userId, upsert(getAllCampaignSessions(userId), session));
  return session;
}

export async function createCampaignSessionHybrid(
  userId: string,
  campaignId: string,
  payload: Partial<CampaignSession>,
): Promise<{ session: CampaignSession; storage: 'backend' | 'local'; warning?: string }> {
  const localSession = createCampaignSession(userId, campaignId, payload);
  if (!hasBackendSession()) return { session: localSession, storage: 'local' };

  try {
    const backendSession = await createBackendCampaignSession(campaignId, localSession);
    replaceStoredSession(userId, localSession, backendSession);
    return { session: normalizeSession(userId, campaignId, backendSession), storage: 'backend' };
  } catch (error) {
    return {
      session: localSession,
      storage: 'local',
      warning: error instanceof ApiNetworkError
        ? 'Backend is offline. Changes may use local fallback.'
        : 'RPG session could not be saved to backend. Kept local fallback.',
    };
  }
}

export function updateCampaignSession(userId: string, campaignId: string, sessionId: string, patch: Partial<CampaignSession>): CampaignSession {
  const sessions = getAllCampaignSessions(userId);
  const session = sessions.find((entry) => entry.id === sessionId && entry.campaignId === campaignId);
  if (!session) throw new Error('Session not found.');
  const updated = normalizeSession(userId, campaignId, { ...session, ...patch, id: session.id, userId, campaignId, updatedAt: now() });
  writeItems(SESSIONS_KEY, userId, sessions.map((entry) => (entry.id === sessionId ? updated : entry)));
  return updated;
}

export async function updateCampaignSessionHybrid(
  userId: string,
  campaignId: string,
  sessionId: string,
  patch: Partial<CampaignSession>,
): Promise<{ session: CampaignSession; storage: 'backend' | 'local'; warning?: string }> {
  const updated = updateCampaignSession(userId, campaignId, sessionId, patch);
  if (!hasBackendSession()) return { session: updated, storage: 'local' };

  try {
    const backendSession = await updateBackendCampaignSession(campaignId, sessionId, {
      title: updated.title,
      summary: updated.summary || '',
      notes: updated.notes || '',
      sessionDate: updated.sessionDate,
    });
    replaceStoredSession(userId, updated, backendSession);
    return { session: normalizeSession(userId, campaignId, backendSession), storage: 'backend' };
  } catch (error) {
    return {
      session: updated,
      storage: 'local',
      warning: error instanceof ApiNetworkError
        ? 'Backend is offline. Changes may use local fallback.'
        : 'RPG session could not be updated in backend. Kept local fallback.',
    };
  }
}

export function deleteCampaignSession(userId: string, campaignId: string, sessionId: string): void {
  writeItems(SESSIONS_KEY, userId, getAllCampaignSessions(userId).filter((session) => !(session.id === sessionId && session.campaignId === campaignId)));
}

export async function deleteCampaignSessionHybrid(
  userId: string,
  campaignId: string,
  sessionId: string,
): Promise<{ storage: 'backend' | 'local'; warning?: string }> {
  const session = getCampaignSessions(userId, campaignId).find((entry) => entry.id === sessionId);
  deleteCampaignSession(userId, campaignId, sessionId);
  if (!session || !hasBackendSession()) return { storage: 'local' };

  try {
    await deleteBackendCampaignSession(campaignId, sessionId);
    return { storage: 'backend' };
  } catch (error) {
    return {
      storage: 'local',
      warning: error instanceof ApiNetworkError
        ? 'Backend is offline. Changes may use local fallback.'
        : 'RPG session was removed locally, but backend removal could not be confirmed.',
    };
  }
}

export function getRpgStats(userId: string): RpgStats {
  const characters = getUserRpgCharacters(userId);
  const campaigns = getUserCampaigns(userId);
  const sessions = getAllCampaignSessions(userId);
  return {
    totalCharacters: characters.length,
    favoriteCharacters: characters.filter((character) => character.isFavorite).length,
    totalCampaigns: campaigns.length,
    favoriteCampaigns: campaigns.filter((campaign) => campaign.isFavorite).length,
    totalSessions: sessions.length,
  };
}
