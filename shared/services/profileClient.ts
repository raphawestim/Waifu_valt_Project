import { apiGet, apiPatch, apiPost } from './apiClient';

export const getBackendProfile = () => apiGet('/users/me');
export const updateBackendProfile = (payload: unknown) => apiPatch('/users/me', payload);
export const getBackendSettings = () => apiGet('/users/me/settings');
export const updateBackendSettings = (payload: unknown) => apiPatch('/users/me/settings', payload);
export const getBackendNsfwStatus = () => apiGet('/users/me/nsfw');
export const enableBackendNsfwAccess = (payload: { termsVersion?: string } = {}) => apiPost('/users/me/nsfw/enable', payload);
export const disableBackendNsfwAccess = () => apiPost('/users/me/nsfw/disable');

export const getApiProfile = getBackendProfile;
export const updateApiProfile = updateBackendProfile;
export const getApiSettings = getBackendSettings;
export const updateApiSettings = updateBackendSettings;
export const getApiNsfwSettings = getBackendNsfwStatus;
export const enableApiNsfw = (termsVersion = '1.0') => enableBackendNsfwAccess({ termsVersion });
export const disableApiNsfw = disableBackendNsfwAccess;
