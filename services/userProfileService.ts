import type { User } from '../types';
import { getAuthToken } from '../shared/services/apiClient';
import {
  disableBackendNsfwAccess,
  enableBackendNsfwAccess,
  getBackendProfile,
  getBackendSettings,
  updateBackendSettings,
} from '../shared/services/profileClient';
import {
  addBackendFavorite,
  getBackendFavorites,
  removeBackendFavorite,
} from '../shared/services/favoritesClient';

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

const PROFILE_PREFIX = 'thevault.profile';
const SETTINGS_PREFIX = 'thevault.userSettings';
const FAVORITES_PREFIX = 'thevault.globalFavorites';
const AUTH_SESSION_KEY = 'thevault.auth.session';
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

function hasBackendSession(): boolean {
  return Boolean(getAuthToken());
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

function normalizeBackendProfile(payload: unknown): UserProfile | null {
  const user = (payload as { user?: UserProfile }).user;
  return user || null;
}

function normalizeBackendSettings(payload: unknown, fallbackUserId: string): UserGlobalSettings | null {
  const settings = (payload as { settings?: Partial<UserGlobalSettings> & { userId?: string; nsfwAcceptedAt?: string | null } }).settings;
  if (!settings) return null;
  return {
    userId: settings.userId || fallbackUserId,
    theme: settings.theme || 'dark',
    defaultVault: settings.defaultVault || 'portal',
    nsfwAccessEnabled: Boolean(settings.nsfwAccessEnabled),
    nsfwTermsAccepted: Boolean(settings.nsfwTermsAccepted),
    nsfwTermsVersion: settings.nsfwTermsVersion || undefined,
    nsfwAcceptedAt: settings.nsfwAcceptedAt || undefined,
    hideNsfwFromPortal: Boolean(settings.hideNsfwFromPortal),
    privacyMode: Boolean(settings.privacyMode),
  };
}

function normalizeBackendFavorites(payload: unknown): GlobalFavoriteItem[] | null {
  const favorites = (payload as { favorites?: GlobalFavoriteItem[] }).favorites;
  return Array.isArray(favorites) ? favorites : null;
}

export function getCurrentUserProfile(): UserProfile | null {
  const currentSession = readJson<unknown | null>(AUTH_SESSION_KEY, null);
  const sessionUser =
    currentSession &&
    typeof currentSession === 'object' &&
    'user' in currentSession
      ? (currentSession as { user?: User }).user
      : (currentSession as User | null);
  const storedUser = sessionUser || readJson<User | null>(LEGACY_USER_KEY, null);
  return storedUser ? profileFromAuthUser(storedUser) : null;
}

export async function getPreferredCurrentUserProfile(): Promise<{ profile: UserProfile | null; backendAvailable: boolean }> {
  if (hasBackendSession()) {
    try {
      const profile = normalizeBackendProfile(await getBackendProfile());
      if (profile) {
        writeJson(profileKey(profile.id), profile);
        return { profile, backendAvailable: true };
      }
    } catch {
      // Local profile remains the offline fallback.
    }
  }
  return { profile: getCurrentUserProfile(), backendAvailable: false };
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

export async function getPreferredUserGlobalSettings(userId: string): Promise<{ settings: UserGlobalSettings; backendAvailable: boolean }> {
  if (hasBackendSession()) {
    try {
      const settings = normalizeBackendSettings(await getBackendSettings(), userId);
      if (settings) {
        writeJson(settingsKey(userId), settings);
        return { settings, backendAvailable: true };
      }
    } catch {
      // Local settings remain the offline fallback.
    }
  }
  return { settings: getUserGlobalSettings(userId), backendAvailable: false };
}

export function updateUserGlobalSettings(
  userId: string,
  settings: Partial<UserGlobalSettings>,
): UserGlobalSettings {
  const updated = { ...getUserGlobalSettings(userId), ...settings, userId };
  writeJson(settingsKey(userId), updated);
  if (hasBackendSession()) {
    void updateBackendSettings(settings).catch(() => undefined);
  }
  return updated;
}

export async function updatePreferredUserGlobalSettings(
  userId: string,
  settings: Partial<UserGlobalSettings>,
): Promise<{ settings: UserGlobalSettings; backendAvailable: boolean }> {
  const local = updateUserGlobalSettings(userId, settings);
  if (hasBackendSession()) {
    try {
      const backend = normalizeBackendSettings(await updateBackendSettings(settings), userId);
      if (backend) {
        writeJson(settingsKey(userId), backend);
        return { settings: backend, backendAvailable: true };
      }
    } catch {
      // Keep local update.
    }
  }
  return { settings: local, backendAvailable: false };
}

export function enableNsfwAccess(userId: string): UserGlobalSettings {
  const updated = updateUserGlobalSettings(userId, {
    nsfwAccessEnabled: true,
    nsfwTermsAccepted: true,
    nsfwTermsVersion: CURRENT_NSFW_TERMS_VERSION,
    nsfwAcceptedAt: now(),
  });
  if (hasBackendSession()) {
    void enableBackendNsfwAccess({ termsVersion: CURRENT_NSFW_TERMS_VERSION }).catch(() => undefined);
  }
  return updated;
}

export function disableNsfwAccess(userId: string): UserGlobalSettings {
  const updated = updateUserGlobalSettings(userId, {
    nsfwAccessEnabled: false,
  });
  if (hasBackendSession()) {
    void disableBackendNsfwAccess().catch(() => undefined);
  }
  return updated;
}

export async function enablePreferredNsfwAccess(userId: string): Promise<{ settings: UserGlobalSettings; backendAvailable: boolean }> {
  const local = updateUserGlobalSettings(userId, {
    nsfwAccessEnabled: true,
    nsfwTermsAccepted: true,
    nsfwTermsVersion: CURRENT_NSFW_TERMS_VERSION,
    nsfwAcceptedAt: now(),
  });
  if (hasBackendSession()) {
    try {
      const settings = normalizeBackendSettings(await enableBackendNsfwAccess({ termsVersion: CURRENT_NSFW_TERMS_VERSION }), userId);
      if (settings) {
        writeJson(settingsKey(userId), settings);
        return { settings, backendAvailable: true };
      }
    } catch {
      // Keep local update.
    }
  }
  return { settings: local, backendAvailable: false };
}

export async function disablePreferredNsfwAccess(userId: string): Promise<{ settings: UserGlobalSettings; backendAvailable: boolean }> {
  const local = updateUserGlobalSettings(userId, { nsfwAccessEnabled: false });
  if (hasBackendSession()) {
    try {
      const settings = normalizeBackendSettings(await disableBackendNsfwAccess(), userId);
      if (settings) {
        writeJson(settingsKey(userId), settings);
        return { settings, backendAvailable: true };
      }
    } catch {
      // Keep local update.
    }
  }
  return { settings: local, backendAvailable: false };
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

export async function getPreferredGlobalFavorites(userId: string): Promise<{ favorites: GlobalFavoriteItem[]; backendAvailable: boolean }> {
  if (hasBackendSession()) {
    try {
      const favorites = normalizeBackendFavorites(await getBackendFavorites());
      if (favorites) {
        writeJson(favoritesKey(userId), favorites);
        return { favorites, backendAvailable: true };
      }
    } catch {
      // Local favorites remain the offline fallback.
    }
  }
  return { favorites: getGlobalFavorites(userId), backendAvailable: false };
}

export function addGlobalFavorite(
  userIdOrItem: string | (Omit<GlobalFavoriteItem, 'id' | 'createdAt'> & { id?: string; createdAt?: string }),
  maybeItem?: Omit<GlobalFavoriteItem, 'id' | 'createdAt' | 'userId'> & { id?: string; createdAt?: string },
): GlobalFavoriteItem[] {
  const item =
    typeof userIdOrItem === 'string'
      ? { ...maybeItem, userId: userIdOrItem }
      : userIdOrItem;

  if (!item || !item.userId || !item.title || !item.vault || !item.type) return [];

  const favorite: GlobalFavoriteItem = {
    ...item,
    id: item.id || makeFavoriteId(item),
    createdAt: item.createdAt || now(),
  };
  const next = [favorite, ...getGlobalFavorites(item.userId).filter((entry) => entry.id !== favorite.id)];
  writeJson(favoritesKey(item.userId), next);
  if (hasBackendSession()) {
    const { userId: _userId, id: _id, createdAt: _createdAt, ...payload } = favorite;
    void addBackendFavorite(payload).catch(() => undefined);
  }
  return next;
}

export async function addPreferredGlobalFavorite(
  userId: string,
  item: Omit<GlobalFavoriteItem, 'id' | 'createdAt' | 'userId'> & { id?: string; createdAt?: string },
): Promise<{ favorites: GlobalFavoriteItem[]; backendAvailable: boolean }> {
  const local = addGlobalFavorite(userId, item);
  if (hasBackendSession()) {
    try {
      const { id: _id, createdAt: _createdAt, ...payload } = item;
      await addBackendFavorite(payload);
      return await getPreferredGlobalFavorites(userId);
    } catch {
      // Keep local favorite.
    }
  }
  return { favorites: local, backendAvailable: false };
}

export function removeGlobalFavorite(userId: string, itemId: string): GlobalFavoriteItem[] {
  const next = getGlobalFavorites(userId).filter((item) => item.id !== itemId);
  writeJson(favoritesKey(userId), next);
  if (hasBackendSession()) {
    void removeBackendFavorite(itemId).catch(() => undefined);
  }
  return next;
}

export async function removePreferredGlobalFavorite(userId: string, itemId: string): Promise<{ favorites: GlobalFavoriteItem[]; backendAvailable: boolean }> {
  const next = removeGlobalFavorite(userId, itemId);
  if (hasBackendSession()) {
    try {
      await removeBackendFavorite(itemId);
      return await getPreferredGlobalFavorites(userId);
    } catch {
      // Keep local removal.
    }
  }
  return { favorites: next, backendAvailable: false };
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
