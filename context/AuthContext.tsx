
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import type { User, WaifuImage, UserList } from '../types';

interface AuthContextType {
    user: User | null;
    favorites: WaifuImage[];
    lists: UserList[];
    login: (username: string) => void;
    logout: () => void;
    addFavorite: (image: WaifuImage) => void;
    removeFavorite: (imageId: string) => void;
    isFavorite: (imageId: string) => boolean;
    createList: (listName: string) => void;
    deleteList: (listName: string) => void;
    addImageToList: (listName: string, image: WaifuImage) => void;
    removeImageFromList: (listName: string, imageId: string) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useLocalStorage<User | null>('waifu-vault-user', null);
    const [favorites, setFavorites] = useLocalStorage<WaifuImage[]>('waifu-vault-favorites', []);
    const [lists, setLists] = useLocalStorage<UserList[]>('waifu-vault-lists', []);

    const login = (username: string) => {
        const token = `mock-token-${Date.now()}`;
        setUser({ username, token });
    };

    const logout = () => {
        setUser(null);
        setFavorites([]);
        setLists([]);
    };

    const addFavorite = (image: WaifuImage) => {
        setFavorites(prev => [...prev.filter(fav => fav.id !== image.id), image]);
    };
    
    const removeFavorite = (imageId: string) => {
        setFavorites(prev => prev.filter(fav => fav.id !== imageId));
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
            removeImageFromList
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
