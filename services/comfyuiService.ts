import type { ComfyUIPromptPayload, ComfyUIStatus } from '../types/ai.types';
import localAIExecutionManager from './LocalAIExecutionManager';
import { getSettings } from './settingsService';

export const getComfyUIStatus = async (): Promise<ComfyUIStatus> => {
  const settings = getSettings();
  try {
    const response = await fetch(`/api/comfyui/status?baseUrl=${encodeURIComponent(settings.comfyuiUrl)}`);
    const data = await response.json() as Partial<ComfyUIStatus> & { running?: boolean };
    const status: ComfyUIStatus = {
      online: Boolean(data.online ?? data.running),
      busy: Boolean(data.busy),
      queueRunning: Number(data.queueRunning || 0),
      queuePending: Number(data.queuePending || 0),
      lastCheckedAt: data.lastCheckedAt || new Date().toISOString(),
      error: data.error || null,
    };
    localAIExecutionManager.setComfyUIStatus(status.online, status.busy);
    return status;
  } catch (error) {
    const status: ComfyUIStatus = {
      online: false,
      busy: false,
      queueRunning: 0,
      queuePending: 0,
      lastCheckedAt: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'ComfyUI unreachable',
    };
    localAIExecutionManager.setComfyUIStatus(false, false);
    return status;
  }
};

export const checkComfyUIHealth = async (): Promise<boolean> => {
  const status = await getComfyUIStatus();
  return status.online;
};

export const sendPromptToComfyUI = async (payload: ComfyUIPromptPayload): Promise<void> => {
  const settings = getSettings();
  localStorage.setItem('wv_comfyui_prepared_prompt', JSON.stringify({ ...payload, createdAt: new Date().toISOString() }));
  await navigator.clipboard?.writeText(payload.positivePrompt).catch(() => undefined);
  await fetch('/api/comfyui/prompt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ baseUrl: settings.comfyuiUrl, payload }),
  }).catch(() => undefined);
};
