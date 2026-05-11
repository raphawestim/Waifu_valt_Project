import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User, WaifuImage, UserList } from '../types';

interface AuthContextType {
    user: User | null;
    favorites: WaifuImage[];
    lists: UserList[];
    login: (username: string) => Promise<void>;
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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(() => {
        const stored = localStorage.getItem('waifu-vault-user');
        return stored ? JSON.parse(stored) : null;
    });
    const [favorites, setFavorites] = useState<WaifuImage[]>([]);
    const [lists, setLists] = useState<UserList[]>([]); // Lists will stay local for now

    useEffect(() => {
        if (user?.username) {
            // Re-sync on load
            fetch('/api/user/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: user.username })
            }).then(res => res.json()).then(data => {
                if (data && data.id) {
                    const updatedUser = { id: data.id, username: data.username, avatar_url: data.avatar_url, blacklistTags: data.blacklistTags, token: user.token };
                    setUser(updatedUser);
                    localStorage.setItem('waifu-vault-user', JSON.stringify(updatedUser));
                    if (data.favorites) {
                        setFavorites(data.favorites.map((f: any) => ({
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
                }
            }).catch(console.error);
        }
    }, []);

    const login = async (username: string) => {
        try {
            const res = await fetch('/api/user/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username })
            });
            const data = await res.json();
            const token = `mock-token-${Date.now()}`;
            const newUser = { id: data.id, username: data.username, avatar_url: data.avatar_url, blacklistTags: data.blacklistTags, token };
            setUser(newUser);
            localStorage.setItem('waifu-vault-user', JSON.stringify(newUser));
            
            if (data.favorites) {
                setFavorites(data.favorites.map((f: any) => ({
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
        } catch (e) {
            console.error('Login failed', e);
        }
    };

    const logout = () => {
        setUser(null);
        setFavorites([]);
        localStorage.removeItem('waifu-vault-user');
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
                localStorage.setItem('waifu-vault-user', JSON.stringify(newUser));
            }
        } catch (e) {
            console.error('Update profile failed', e);
        }
    };

    const addFavorite = async (image: WaifuImage) => {
        if (!user?.id) return;
        // Optimistic update
        setFavorites(prev => [...prev.filter(fav => fav.id !== image.id), image]);
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
            favorites,
            lists,
            login,
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
