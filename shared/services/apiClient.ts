const FALLBACK_API_BASE_URL = 'http://localhost:3333';
const API_BASE_URL = (import.meta.env.VITE_API_URL || FALLBACK_API_BASE_URL).replace(/\/+$/, '');
const AUTH_TOKEN_KEY = 'thevault.auth.token';
const LEGACY_AUTH_TOKEN_KEY = 'thevault.api.authToken';
const isDev = Boolean(import.meta.env.DEV);

export class ApiNetworkError extends Error {
  code: 'network_or_cors';

  constructor(message = 'Backend request failed. Check that the API is running and CORS allows this frontend origin.') {
    super(message);
    this.name = 'ApiNetworkError';
    this.code = 'network_or_cors';
  }
}

export class ApiHttpError extends Error {
  status: number;
  payload: unknown;

  constructor(status: number, message: string, payload: unknown) {
    super(message);
    this.name = 'ApiHttpError';
    this.status = status;
    this.payload = payload;
  }
}

export interface ApiHealth {
  ok: boolean;
  service: string;
  timestamp: string;
  database: 'connected' | 'unknown';
  redis: 'connected' | 'unknown';
}

interface ApiRequestOptions {
  signal?: AbortSignal;
}

export function setAuthToken(token: string | null): void {
  if (!token) {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(LEGACY_AUTH_TOKEN_KEY);
    return;
  }
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function getAuthToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY) || localStorage.getItem(LEGACY_AUTH_TOKEN_KEY);
}

export function clearAuthToken(): void {
  setAuthToken(null);
}

export function getApiBaseUrl(): string {
  return API_BASE_URL;
}

function warnDev(message: string, error: unknown): void {
  if (isDev) console.warn(message, error);
}

function shouldLogAuthPresence(path: string): boolean {
  return isDev && (
    path.startsWith('/me/games') ||
    path.startsWith('/me/decks') ||
    path.startsWith('/me/manga') ||
    path.startsWith('/me/rpg') ||
    path.startsWith('/me/favorites') ||
    path.startsWith('/auth/me') ||
    path.startsWith('/auth/debug-token') ||
    path.startsWith('/users/me')
  );
}

async function apiRequest<T>(method: string, path: string, body?: unknown, options?: ApiRequestOptions): Promise<T> {
  const token = getAuthToken();
  if (shouldLogAuthPresence(path)) {
    console.warn(`[apiClient] ${method} ${path} Authorization header present: ${Boolean(token)}`);
  }
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: options?.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    warnDev(`[The Vault API] ${method} ${API_BASE_URL}${path} failed before receiving an HTTP response.`, error);
    throw new ApiNetworkError();
  }

  if (response.status === 204) return undefined as T;

  const payload = (await response.json().catch(() => ({}))) as T & { message?: string };
  if (!response.ok) {
    warnDev(`[The Vault API] ${method} ${path} returned HTTP ${response.status}.`, payload);
    throw new ApiHttpError(response.status, payload.message || `API request failed: ${method} ${path}`, payload);
  }
  return payload;
}

export const apiGet = <T>(path: string, options?: ApiRequestOptions) => apiRequest<T>('GET', path, undefined, options);
export const apiPost = <T>(path: string, body?: unknown, options?: ApiRequestOptions) => apiRequest<T>('POST', path, body, options);
export const apiPatch = <T>(path: string, body?: unknown, options?: ApiRequestOptions) => apiRequest<T>('PATCH', path, body, options);
export const apiDelete = <T>(path: string, options?: ApiRequestOptions) => apiRequest<T>('DELETE', path, undefined, options);

export async function checkApiHealth(): Promise<ApiHealth | null> {
  try {
    const health = await apiGet<ApiHealth>('/health');
    return health.ok ? health : null;
  } catch {
    return null;
  }
}

export async function isApiAvailable(): Promise<boolean> {
  const health = await checkApiHealth();
  return Boolean(health?.ok);
}
