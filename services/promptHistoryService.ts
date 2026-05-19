import type { PromptHistoryItem } from '../types/ai.types';

const HISTORY_KEY = 'wv_prompt_history';

const readHistory = (): PromptHistoryItem[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PromptHistoryItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeHistory = (items: PromptHistoryItem[]): void => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(HISTORY_KEY, JSON.stringify(items));
};

export const savePromptHistoryItem = (item: PromptHistoryItem): void => {
  const safeItem: PromptHistoryItem = {
    ...item,
    fullAnalysisJson: { ...item.fullAnalysisJson },
    imageUrl: item.imageUrl?.startsWith('data:') ? undefined : item.imageUrl,
    thumbnailUrl: item.thumbnailUrl?.startsWith('data:') ? undefined : item.thumbnailUrl,
  };
  const existing = readHistory().filter(historyItem => historyItem.id !== safeItem.id);
  writeHistory([safeItem, ...existing].slice(0, 200));
};

export const getPromptHistory = (): PromptHistoryItem[] => readHistory();

export const deletePromptHistoryItem = (id: string): void => {
  writeHistory(readHistory().filter(item => item.id !== id));
};

export const clearPromptHistory = (): void => {
  writeHistory([]);
};

export const searchPromptHistory = (query: string): PromptHistoryItem[] => {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return readHistory();

  return readHistory().filter(item => {
    const haystack = [
      item.mode,
      item.modelUsed,
      item.targetCheckpoint,
      item.positivePrompt,
      item.negativePrompt,
      item.tags.join(' '),
      item.source || '',
    ].join(' ').toLowerCase();
    return haystack.includes(normalized);
  });
};
