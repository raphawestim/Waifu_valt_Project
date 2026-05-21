import type { User } from '../types';

export const CURRENT_NSFW_TERMS_VERSION = '1.0';

export interface UserProfile {
  id: string;
  username: string;
  displayName?: string;
  email?: string;
  avatarUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserGlobalSettings {
  userId: string;
  theme?: 'dark' | 'light' | 'system';
  defaultVault?: 'portal' | 'games' | 'tcg' | 'manga' | 'rpg' | 'forge' | 'nsfw';
  nsfwAccessEnabled: boolean;
  nsfwTermsAccepted: boolean;
  nsfwTermsVersion?: string;
  nsfwAcceptedAt?: string;
  hideNsfwFromPortal?: boolean;
  privacyMode?: boolean;
}

export interface GlobalFavoriteItem {
  id: string;
  userId: string;
  vault: 'games' | 'tcg' | 'manga' | 'rpg' | 'forge' | 'nsfw';
  type:
    | 'game'
    | 'card'
    | 'pokemon'
    | 'deck'
    | 'manga'
    | 'anime'
    | 'image'
    | 'video'
    | 'prompt'
    | 'character'
    | 'campaign';
  source?: string;
  externalId?: string;
  title: string;
  thumbnailUrl?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

const PROFILE_PREFIX = 'the-vault:profile';
const SETTINGS_PREFIX = 'the-vault:settings';
const FAVORITES_PREFIX = 'the-vault:global-favorites';
const LEGACY_USER_KEY = 'waifu-vault-user';

const now = () => new Date().toISOString();
const makeFavoriteId = (item: Omit<GlobalFavoriteItem, 'id' | 'createdAt'>) =>
  `${item.vault}:${item.type}:${item.source || 'local'}:${item.externalId || item.title}`.toLowerCase();

const resolveUserId = (user: Pick<User, 'id' | 'username'>) => user.id || `local-${user.username}`;

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

const profileKey = (userId: string) => `${PROFILE_PREFIX}:${userId}`;
const settingsKey = (userId: string) => `${SETTINGS_PREFIX}:${userId}`;
const favoritesKey = (userId: string) => `${FAVORITES_PREFIX}:${userId}`;

export function profileFromAuthUser(user: User): UserProfile {
  const id = resolveUserId(user);
  const stored = readJson<UserProfile | null>(profileKey(id), null);
  const baseProfile: UserProfile = {
    id,
    username: user.username,
    displayName: user.username,
    avatarUrl: user.avatar_url,
    createdAt: stored?.createdAt || now(),
    updatedAt: stored?.updatedAt || now(),
  };
  return { ...baseProfile, ...stored, username: stored?.username || user.username };
}

export function getCurrentUserProfile(): UserProfile | null {
  const storedUser = readJson<User | null>(LEGACY_USER_KEY, null);
  return storedUser ? profileFromAuthUser(storedUser) : null;
}

export function updateUserProfile(profile: UserProfile): UserProfile {
  const updated = { ...profile, updatedAt: now() };
  writeJson(profileKey(profile.id), updated);
  return updated;
}

export function getUserGlobalSettings(userId: string): UserGlobalSettings {
  const defaults: UserGlobalSettings = {
    userId,
    theme: 'dark',
    defaultVault: 'portal',
    nsfwAccessEnabled: false,
    nsfwTermsAccepted: false,
    hideNsfwFromPortal: false,
    privacyMode: false,
  };
  return { ...defaults, ...readJson<Partial<UserGlobalSettings>>(settingsKey(userId), {}) };
}

export function updateUserGlobalSettings(
  userId: string,
  settings: Partial<UserGlobalSettings>,
): UserGlobalSettings {
  const updated = { ...getUserGlobalSettings(userId), ...settings, userId };
  writeJson(settingsKey(userId), updated);
  return updated;
}

export function enableNsfwAccess(userId: string): UserGlobalSettings {
  return updateUserGlobalSettings(userId, {
    nsfwAccessEnabled: true,
    nsfwTermsAccepted: true,
    nsfwTermsVersion: CURRENT_NSFW_TERMS_VERSION,
    nsfwAcceptedAt: now(),
  });
}

export function disableNsfwAccess(userId: string): UserGlobalSettings {
  return updateUserGlobalSettings(userId, {
    nsfwAccessEnabled: false,
  });
}

export function hasNsfwAccess(userId: string): boolean {
  const settings = getUserGlobalSettings(userId);
  return Boolean(
    settings.nsfwAccessEnabled &&
      settings.nsfwTermsAccepted &&
      settings.nsfwTermsVersion === CURRENT_NSFW_TERMS_VERSION,
  );
}

export function getGlobalFavorites(userId: string): GlobalFavoriteItem[] {
  return readJson<GlobalFavoriteItem[]>(favoritesKey(userId), []);
}

export function addGlobalFavorite(
  item: Omit<GlobalFavoriteItem, 'id' | 'createdAt'> & { id?: string; createdAt?: string },
): GlobalFavoriteItem[] {
  const favorite: GlobalFavoriteItem = {
    ...item,
    id: item.id || makeFavoriteId(item),
    createdAt: item.createdAt || now(),
  };
  const next = [favorite, ...getGlobalFavorites(item.userId).filter((entry) => entry.id !== favorite.id)];
  writeJson(favoritesKey(item.userId), next);
  return next;
}

export function removeGlobalFavorite(userId: string, itemId: string): GlobalFavoriteItem[] {
  const next = getGlobalFavorites(userId).filter((item) => item.id !== itemId);
  writeJson(favoritesKey(userId), next);
  return next;
}

export function isGlobalFavorite(
  userId: string,
  vault: GlobalFavoriteItem['vault'],
  type: GlobalFavoriteItem['type'],
  source?: string,
  externalId?: string,
): boolean {
  return getGlobalFavorites(userId).some(
    (item) =>
      item.vault === vault &&
      item.type === type &&
      item.source === source &&
      item.externalId === externalId,
  );
}
