import { apiGet, apiPost, clearAuthToken, setAuthToken } from './apiClient';

export interface ApiUser {
  id: string;
  username: string;
  email?: string;
  displayName?: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: ApiUser;
  token: string;
}

function normalizeAuthResponse(payload: unknown): AuthResponse {
  const response = payload as Partial<AuthResponse> & {
    accessToken?: string;
    jwt?: string;
    data?: Partial<AuthResponse> & { accessToken?: string; jwt?: string };
  };
  const user = response.user || response.data?.user;
  const token = response.token || response.accessToken || response.jwt || response.data?.token || response.data?.accessToken || response.data?.jwt;

  if (!user || !token) {
    throw new Error('Backend login did not return a token.');
  }

  return { user, token };
}

export async function registerWithBackend(payload: {
  username: string;
  email?: string;
  password: string;
  displayName?: string;
}): Promise<AuthResponse> {
  const result = normalizeAuthResponse(await apiPost<unknown>('/auth/register', payload));
  setAuthToken(result.token);
  return result;
}

export async function loginWithBackend(payload: { usernameOrEmail: string; password: string }): Promise<AuthResponse> {
  const result = normalizeAuthResponse(await apiPost<unknown>('/auth/login', payload));
  setAuthToken(result.token);
  return result;
}

export async function getMeFromBackend(): Promise<{ user: ApiUser }> {
  return apiGet('/auth/me');
}

export function logoutBackend(): void {
  clearAuthToken();
}

export const registerWithApi = registerWithBackend;
export const loginWithApi = loginWithBackend;
export const getApiMe = getMeFromBackend;
