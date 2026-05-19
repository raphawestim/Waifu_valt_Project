import type { AppAISettings } from '../types/ai.types';

const SETTINGS_KEY = 'wv_ai_settings';

export const DEFAULT_SETTINGS: AppAISettings = {
  ollamaBaseUrl: 'http://localhost:11434',
  ollamaSfwModel: 'gemma4:e4b',
  ollamaNsfwModel: 'dolphin3',
  ollamaFallbackModel: 'dolphin-mistral',
  ollamaDefaultChatModel: 'auto',
  comfyuiUrl: 'http://127.0.0.1:8188',
  defaultMode: 'sfw',
  defaultTargetCheckpoint: 'generic',
  vaultChatEnabled: true,
  vaultChatPosition: 'right',
  lowMemoryMode: true,
  comfyuiPriorityMode: true,
  blockOllamaWhenComfyuiBusy: true,
  keepAlivePromptLab: '30s',
  keepAliveChat: '2m',
  maxPromptVariationsPerRequest: 3,
  maxChatHistoryInMemory: 20,
  autoUnloadAfterRequest: true,
  comfyuiPollingActivMs: 3000,
  comfyuiPollingIdleMs: 20000,
};

type SettingsSubscriber = (settings: AppAISettings) => void;

const subscribers = new Set<SettingsSubscriber>();

const isBrowser = () => typeof window !== 'undefined' && Boolean(window.localStorage);

const emit = (settings: AppAISettings) => {
  subscribers.forEach(callback => callback(settings));
};

export const getSettings = (): AppAISettings => {
  if (!isBrowser()) return DEFAULT_SETTINGS;

  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<AppAISettings>;
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
};

export const updateSettings = (updates: Partial<AppAISettings>): AppAISettings => {
  const next = { ...getSettings(), ...updates };
  if (isBrowser()) {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  }
  emit(next);
  return next;
};

export const resetSettings = (): AppAISettings => {
  if (isBrowser()) {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS));
  }
  emit(DEFAULT_SETTINGS);
  return DEFAULT_SETTINGS;
};

export const subscribeToSettings = (callback: SettingsSubscriber): (() => void) => {
  subscribers.add(callback);
  return () => subscribers.delete(callback);
};
