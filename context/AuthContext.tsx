import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User, WaifuImage, UserList } from '../types';
import { addGlobalFavorite, getGlobalFavorites, removeGlobalFavorite } from '../services/userProfileService';
import { ApiHttpError, ApiNetworkError, clearAuthToken, getAuthToken, setAuthToken } from '../shared/services/apiClient';
import {
    getMeFromBackend,
    loginWithBackend,
    logoutBackend,
    registerWithBackend,
    type ApiUser,
} from '../shared/services/authClient';

export interface AuthCredentials {
    username: string;
    password?: string;
    email?: string;
    displayName?: string;
}

export type AuthMode = 'backend' | 'local';

export interface AuthOptions {
    mode?: AuthMode;
}

export interface AuthSession {
    user: User;
    token?: string;
    mode: AuthMode;
}

interface AuthContextType {
    user: User | null;
    authMode: AuthMode | null;
    favorites: WaifuImage[];
    lists: UserList[];
    login: (credentials: string | AuthCredentials, options?: AuthOptions) => Promise<void>;
    register: (credentials: string | AuthCredentials, options?: AuthOptions) => Promise<void>;
    logout: () => void;
    addFavorite: (image: WaifuImage) => Promise<void>;
    removeFavorite: (imageId: string) => Promise<void>;
    isFavorite: (imageId: string) => boolean;
    createList: (listName: string) => void;
    deleteList: (listName: string) => void;
    addImageToList: (listName: string, image: WaifuImage) => void;
    removeImageFromList: (listName: string, imageId: string) => void;
    updateProfile: (data: FormData) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);
const AUTH_SESSION_KEY = 'thevault.auth.session';
const LEGACY_AUTH_SESSION_KEY = 'waifu-vault-user';
const USERS_KEY = 'thevault.users';

type StoredAuthUser = User & { createdAt?: string };

interface FavoriteApiResponse {
    imageId: string;
    thumbnailUrl: string;
    fullUrl: string;
    tags: string;
    score: number;
    artist?: string;
    sourceApi: WaifuImage['sourceApi'];
    rating: WaifuImage['rating'];
    width: number;
    height: number;
    type: WaifuImage['type'];
}

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

function getStoredUsers(): StoredAuthUser[] {
    return readJson<StoredAuthUser[]>(USERS_KEY, []);
}

function saveStoredUser(user: StoredAuthUser): StoredAuthUser {
    const users = getStoredUsers();
    const next = [user, ...users.filter((entry) => entry.id !== user.id && entry.username !== user.username)];
    writeJson(USERS_KEY, next);
    return user;
}

function createLocalUser(username: string): StoredAuthUser {
    const normalizedUsername = username.trim();
    const existing = getStoredUsers().find((entry) => entry.username.toLowerCase() === normalizedUsername.toLowerCase());
    if (existing) return { ...existing, token: `local-token-${Date.now()}` };

    return saveStoredUser({
        id: `local-${normalizedUsername.toLowerCase().replace(/\s+/g, '-')}`,
        username: normalizedUsername,
        avatar_url: '',
        blacklistTags: '',
        token: `local-token-${Date.now()}`,
        authMode: 'local',
        createdAt: new Date().toISOString(),
    });
}

function normalizeCredentials(credentials: string | AuthCredentials): AuthCredentials {
    return typeof credentials === 'string' ? { username: credentials } : credentials;
}

function userFromApiUser(apiUser: ApiUser, token?: string): User {
    return {
        id: apiUser.id,
        username: apiUser.displayName || apiUser.username,
        avatar_url: apiUser.avatarUrl || '',
        blacklistTags: '',
        token: token || getAuthToken() || `api-token-${Date.now()}`,
        authMode: 'backend',
    };
}

function inferLegacyMode(user: User): AuthMode {
    return user.authMode || (user.token ? 'backend' : 'local');
}

function normalizeStoredSession(raw: unknown): AuthSession | null {
    if (!raw || typeof raw !== 'object') return null;
    const maybeSession = raw as Partial<AuthSession>;
    if (maybeSession.user?.username) {
        const mode = maybeSession.mode || maybeSession.user.authMode || (maybeSession.token ? 'backend' : 'local');
        return {
            user: { ...maybeSession.user, authMode: mode },
            token: maybeSession.token,
            mode,
        };
    }

    const maybeUser = raw as User;
    if (!maybeUser.username) return null;
    const mode = inferLegacyMode(maybeUser);
    return {
        user: { ...maybeUser, authMode: mode },
        token: mode === 'backend' ? maybeUser.token : undefined,
        mode,
    };
}

function readStoredSession(): AuthSession | null {
    const session = (
        normalizeStoredSession(readJson<unknown | null>(AUTH_SESSION_KEY, null)) ||
        normalizeStoredSession(readJson<unknown | null>(LEGACY_AUTH_SESSION_KEY, null))
    );
    if (!session) return null;
    const storedToken = getAuthToken() || session.token || session.user.token;
    if (session.mode === 'backend' && !storedToken) {
        localStorage.removeItem(AUTH_SESSION_KEY);
        localStorage.removeItem(LEGACY_AUTH_SESSION_KEY);
        clearAuthToken();
        return null;
    }
    if (session.mode === 'backend' && storedToken && !getAuthToken()) {
        setAuthToken(storedToken);
    }
    return session;
}

function persistSession(user: User, mode: AuthMode): void {
    const token = mode === 'backend' ? getAuthToken() || user.token : undefined;
    const sessionUser = mode === 'backend' ? { ...user, token, authMode: mode } : { ...user, authMode: mode };
    const session: AuthSession = { user: sessionUser, token, mode };
    writeJson(AUTH_SESSION_KEY, session);
    localStorage.setItem(LEGACY_AUTH_SESSION_KEY, JSON.stringify(sessionUser));
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [authMode, setAuthMode] = useState<AuthMode | null>(() => readStoredSession()?.mode || null);
    const [user, setUser] = useState<User | null>(() => readStoredSession()?.user || null);
    const [favorites, setFavorites] = useState<WaifuImage[]>([]);
    const [lists, setLists] = useState<UserList[]>([]); // Lists will stay local for now

    useEffect(() => {
        const session = readStoredSession();
        const token = getAuthToken();
        if (session?.mode === 'backend' && !token) {
            setUser(null);
            setAuthMode(null);
            localStorage.removeItem(AUTH_SESSION_KEY);
            localStorage.removeItem(LEGACY_AUTH_SESSION_KEY);
            clearAuthToken();
            return;
        }
        if (!token) return;
        let cancelled = false;
        getMeFromBackend()
            .then(({ user: apiUser }) => {
                if (cancelled) return;
                const updatedUser = userFromApiUser(apiUser);
                setUser(updatedUser);
                setAuthMode('backend');
                persistSession(updatedUser, 'backend');
            })
            .catch((error) => {
                if (error instanceof ApiNetworkError) return;
                if (error instanceof ApiHttpError && error.status === 401) {
                    setUser(null);
                    setAuthMode(null);
                    localStorage.removeItem(AUTH_SESSION_KEY);
                    localStorage.removeItem(LEGACY_AUTH_SESSION_KEY);
                }
                clearAuthToken();
            });
        return () => {
            cancelled = true;
        };
    }, []);

    const requireBackendPassword = (password?: string) => {
        if (!password) throw new Error('Password is required.');
        if (password.length < 8) throw new Error('Password must be at least 8 characters.');
    };

    const login = async (credentials: string | AuthCredentials, options: AuthOptions = { mode: 'backend' }) => {
        const input = normalizeCredentials(credentials);
        const mode = options.mode || 'backend';
        if (mode === 'backend') {
            requireBackendPassword(input.password);
            try {
                const result = await loginWithBackend({
                    usernameOrEmail: input.username,
                    password: input.password!,
                });
                if (!result.token) throw new Error('Backend login did not return a token.');
                setAuthToken(result.token);
                const newUser = userFromApiUser(result.user, result.token);
                setUser(newUser);
                setAuthMode('backend');
                persistSession(newUser, 'backend');
                return;
            } catch (error) {
                if (error instanceof ApiNetworkError) throw new Error(`${error.message} You can use Local Mode for development.`);
                throw error;
            }
        }

        clearAuthToken();
        const newUser = createLocalUser(input.username);
        const localUser = { ...newUser, authMode: 'local' as const };
        setUser(localUser);
        setAuthMode('local');
        persistSession(localUser, 'local');
    };

    const register = async (credentials: string | AuthCredentials, options: AuthOptions = { mode: 'backend' }) => {
        const input = normalizeCredentials(credentials);
        const mode = options.mode || 'backend';
        if (mode === 'backend') {
            requireBackendPassword(input.password);
            try {
                const result = await registerWithBackend({
                    username: input.username,
                    email: input.email,
                    password: input.password!,
                    displayName: input.displayName || input.username,
                });
                if (!result.token) throw new Error('Backend login did not return a token.');
                setAuthToken(result.token);
                const newUser = userFromApiUser(result.user, result.token);
                setUser(newUser);
                setAuthMode('backend');
                persistSession(newUser, 'backend');
                return;
            } catch (error) {
                if (error instanceof ApiNetworkError) throw new Error(`${error.message} You can create a local development profile instead.`);
                throw error;
            }
        }

        clearAuthToken();
        const newUser = createLocalUser(input.username);
        const localUser = { ...newUser, authMode: 'local' as const };
        setUser(localUser);
        setAuthMode('local');
        persistSession(localUser, 'local');
    };

    const syncLegacyLogin = async (username: string) => {
        try {
            const res = await fetch('/api/user/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username })
            });
            const data = await res.json();
            if (!data?.id) return;
            const token = `mock-token-${Date.now()}`;
            const newUser = { id: data.id, username: data.username, avatar_url: data.avatar_url, blacklistTags: data.blacklistTags, token, authMode: 'local' as const };
            setUser(newUser);
            setAuthMode('local');
            persistSession(newUser, 'local');
            if (data.favorites) {
                setFavorites(data.favorites.map((f: FavoriteApiResponse) => ({
                    id: f.imageId,
                    thumbnailUrl: f.thumbnailUrl,
                    fullUrl: f.fullUrl,
                    tags: f.tags.split(','),
                    score: f.score,
                    artist: f.artist,
                    sourceApi: f.sourceApi,
                    rating: f.rating,
                    width: f.width,
                    height: f.height,
                    type: f.type
                })));
            }
        } catch {
            // Old local API is optional and should not block the MVP fallback.
        }
    };

    const logout = () => {
        setUser(null);
        setAuthMode(null);
        setFavorites([]);
        logoutBackend();
        localStorage.removeItem(AUTH_SESSION_KEY);
        localStorage.removeItem(LEGACY_AUTH_SESSION_KEY);
    };

    const updateProfile = async (data: FormData) => {
        if (!user?.id) return;
        data.append('id', user.id);
        try {
            const res = await fetch('/api/user/update', {
                method: 'POST',
                body: data
            });
            const updated = await res.json();
            if (updated && updated.id) {
                const newUser = { ...user, username: updated.username, avatar_url: updated.avatar_url, blacklistTags: updated.blacklistTags };
                setUser(newUser);
                persistSession(newUser, authMode || user.authMode || 'local');
            }
        } catch (e) {
            console.error('Update profile failed', e);
        }
    };

    const addFavorite = async (image: WaifuImage) => {
        if (!user?.id) return;
        // Optimistic update
        setFavorites(prev => [...prev.filter(fav => fav.id !== image.id), image]);
        addGlobalFavorite({
            userId: user.id,
            vault: 'nsfw',
            type: image.type === 'video' ? 'video' : 'image',
            source: image.sourceApi,
            externalId: image.id,
            title: image.tags[0]?.replace(/_/g, ' ') || 'Vault NSFW favorite',
            thumbnailUrl: image.thumbnailUrl,
            metadata: { rating: image.rating, type: image.type },
        });
        try {
            await fetch('/api/favorites/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, image })
            });
        } catch (e) {
            console.error('Failed to add favorite to db', e);
        }
    };
    
    const removeFavorite = async (imageId: string) => {
        if (!user?.id) return;
        // Optimistic update
        setFavorites(prev => prev.filter(fav => fav.id !== imageId));
        const globalFavorite = getGlobalFavorites(user.id).find((item) => item.vault === 'nsfw' && item.externalId === imageId);
        if (globalFavorite) removeGlobalFavorite(user.id, globalFavorite.id);
        try {
            await fetch('/api/favorites/remove', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, imageId })
            });
        } catch (e) {
            console.error('Failed to remove favorite from db', e);
        }
    };
    
    const isFavorite = useCallback((imageId: string) => {
        return favorites.some(fav => fav.id === imageId);
    }, [favorites]);

    const createList = (listName: string) => {
        if (!lists.some(list => list.name === listName)) {
            setLists(prev => [...prev, { name: listName, images: [] }]);
        }
    };

    const deleteList = (listName: string) => {
        setLists(prev => prev.filter(list => list.name !== listName));
    };

    const addImageToList = (listName: string, image: WaifuImage) => {
        setLists(prev => prev.map(list => {
            if (list.name === listName && !list.images.some(img => img.id === image.id)) {
                return { ...list, images: [...list.images, image] };
            }
            return list;
        }));
    };

    const removeImageFromList = (listName: string, imageId: string) => {
        setLists(prev => prev.map(list => {
            if (list.name === listName) {
                return { ...list, images: list.images.filter(img => img.id !== imageId) };
            }
            return list;
        }));
    };

    return (
        <AuthContext.Provider value={{
            user,
            authMode,
            favorites,
            lists,
            login,
            register,
            logout,
            addFavorite,
            removeFavorite,
            isFavorite,
            createList,
            deleteList,
            addImageToList,
            removeImageFromList,
            updateProfile
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
