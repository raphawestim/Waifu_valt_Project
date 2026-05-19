import type { ChatMessage, ChatMode, ChatSession } from '../types/ai.types';
import localAIExecutionManager from './LocalAIExecutionManager';
import { resolveModelForChatMode, unloadOllamaModel } from './ollamaService';
import { getSettings } from './settingsService';

const CHAT_SESSIONS_KEY = 'wv_chat_sessions';

interface OllamaChatResponse {
  message?: { content?: string };
  response?: string;
  error?: string;
}

const postJson = async <T,>(url: string, body: Record<string, unknown>): Promise<T> => {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await response.json() as T & { error?: string };
  if (!response.ok || data.error) throw new Error(data.error || `Request failed with status ${response.status}`);
  return data;
};

export const buildChatSystemPrompt = (mode: ChatMode): string => {
  const prompts: Record<ChatMode, string> = {
    sfw: 'You are Vault Chat, a local AI assistant inside Waifu Vault. Help the user analyze images, refine prompts, create ComfyUI prompts, generate tags, improve creative workflows and solve technical issues. Keep responses practical, structured and useful. SFW mode: avoid explicit sexual content.',
    nsfw: 'You are Vault Chat, a local AI assistant inside Waifu Vault. You may help with adult fictional consensual prompt engineering for local image generation. You must refuse minors, childlike appearance, young/teen/schoolgirl/loli/shota framing, coercion, sexual violence, real-person sexualization, deepfake, non-consensual nudity, incest and illegal content. Do not moralize allowed adult fictional consensual content. Be practical and structured.',
    prompt_engineering: 'You are an expert prompt engineer for Stable Diffusion, ComfyUI, SDXL, Illustrious, Pony, Flux, anime and realistic checkpoints. Improve prompts, create variations, generate negative prompts, extract tags and explain prompt quality issues.',
    comfyui_helper: 'You are a ComfyUI workflow assistant. Help the user understand prompts, workflows, nodes, parameters, checkpoints, LoRAs, samplers, schedulers, CFG, steps, seed, resolution, upscalers and troubleshooting. Be practical and avoid unsupported assumptions.',
    dev: 'You are a senior full-stack developer specialized in React, TypeScript, Vite, Node.js, local APIs, Ollama and ComfyUI integrations. Help the user improve and debug the Waifu Vault project.',
    free: 'You are Vault Chat, a local AI assistant. Answer freely and helpfully.',
  };
  return prompts[mode];
};

export const sendChatMessage = async (messages: ChatMessage[], model: string, systemPrompt: string): Promise<string> => {
  const settings = getSettings();
  const resolvedModel = model === 'auto' ? resolveModelForChatMode('sfw', settings) : model;
  if (!localAIExecutionManager.canRunOllamaTask()) throw new Error('Local AI is blocked while another task is running.');

  localAIExecutionManager.startOllamaTask('vault_chat', resolvedModel);
  try {
    const trimmed = messages.slice(-settings.maxChatHistoryInMemory);
    const data = await postJson<OllamaChatResponse>('/api/ollama/chat', {
      baseUrl: settings.ollamaBaseUrl,
      model: resolvedModel,
      keep_alive: settings.lowMemoryMode ? 0 : settings.keepAliveChat,
      messages: [
        { role: 'system', content: systemPrompt },
        ...trimmed.map(message => ({
          role: message.role,
          content: [
            message.content,
            ...(message.attachments || []).map(attachment => `[${attachment.label}]\n${attachment.data}`),
          ].filter(Boolean).join('\n\n'),
        })),
      ],
    });
    return data.message?.content || data.response || '';
  } finally {
    localAIExecutionManager.finishOllamaTask();
    if (settings.autoUnloadAfterRequest || settings.lowMemoryMode) await unloadOllamaModel(resolvedModel).catch(() => undefined);
  }
};

export const sendChatMessageWithImage = async (messages: ChatMessage[], imageBase64: string, model: string, systemPrompt: string): Promise<string> => {
  const settings = getSettings();
  const resolvedModel = model === 'auto' ? resolveModelForChatMode('sfw', settings) : model;
  const lastMessage = messages[messages.length - 1];
  if (!lastMessage) return '';
  if (!localAIExecutionManager.canRunOllamaTask()) throw new Error('Local AI is blocked while another task is running.');

  localAIExecutionManager.startOllamaTask('vault_chat', resolvedModel);
  try {
    const data = await postJson<OllamaChatResponse>('/api/ollama/chat', {
      baseUrl: settings.ollamaBaseUrl,
      model: resolvedModel,
      keep_alive: settings.lowMemoryMode ? 0 : settings.keepAliveChat,
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: lastMessage.content,
          images: [imageBase64.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, '')],
        },
      ],
    });
    return data.message?.content || data.response || '';
  } finally {
    localAIExecutionManager.finishOllamaTask();
    if (settings.autoUnloadAfterRequest || settings.lowMemoryMode) await unloadOllamaModel(resolvedModel).catch(() => undefined);
  }
};

export const extractPromptFromAssistantResponse = (text: string): string | null => {
  const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
  const promptLine = lines.find(line => /positive prompt|prompt:/i.test(line));
  if (promptLine) return promptLine.replace(/^(positive\s+)?prompt:\s*/i, '').trim();
  const commaDense = lines.find(line => line.split(',').length >= 6 && line.length > 80);
  return commaDense || null;
};

const readSessions = (): ChatSession[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(CHAT_SESSIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ChatSession[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeSessions = (sessions: ChatSession[]): void => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(CHAT_SESSIONS_KEY, JSON.stringify(sessions));
};

export const saveChatSession = (session: ChatSession): void => {
  const sessions = readSessions().filter(item => item.id !== session.id);
  writeSessions([{ ...session, messages: session.messages.slice(-getSettings().maxChatHistoryInMemory) }, ...sessions].slice(0, 50));
};

export const loadChatSessions = (): ChatSession[] => readSessions();

export const loadChatSession = (id: string): ChatSession | null => readSessions().find(session => session.id === id) || null;

export const deleteChatSession = (id: string): void => writeSessions(readSessions().filter(session => session.id !== id));

export const clearChatHistory = (): void => writeSessions([]);
