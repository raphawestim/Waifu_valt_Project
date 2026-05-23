import { apiDelete, apiGet, apiPost } from './apiClient';

export const getBackendFavorites = () => apiGet('/me/favorites');
export const addBackendFavorite = (payload: unknown) => apiPost('/me/favorites', payload);
export const removeBackendFavorite = (id: string) => apiDelete(`/me/favorites/${id}`);

export const getApiFavorites = getBackendFavorites;
export const addApiFavorite = addBackendFavorite;
export const deleteApiFavorite = removeBackendFavorite;
