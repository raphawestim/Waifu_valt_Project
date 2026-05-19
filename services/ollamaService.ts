import type {
  AppAISettings,
  ChatMode,
  ImageAnalysisRequest,
  ImageAnalysisResult,
  PromptMode,
} from '../types/ai.types';
import localAIExecutionManager from './LocalAIExecutionManager';
import { PROMPT_TEMPLATE_SYSTEM_PROMPT } from './promptTemplateEngine';
import { getSettings } from './settingsService';

interface OllamaGenerateResponse {
  response?: string;
  error?: string;
}

interface OllamaModelsResponse {
  models?: Array<{ name: string; model?: string }>;
}

const SFW_SYSTEM_PROMPT = 'You are an expert image analyst and prompt engineer for Stable Diffusion, ComfyUI, SDXL, Illustrious, Pony, Flux, anime and realistic checkpoints. Analyze the provided image and create a high-quality generation prompt based strictly on visible visual evidence. Return only valid JSON. Do not include markdown. Do not invent identities. Focus on subject, pose, outfit, composition, camera angle, lighting, color palette, background, mood, rendering style and generation tags. This is SFW mode: avoid explicit sexual content and produce a premium artistic prompt.';

const NSFW_SYSTEM_PROMPT = 'You are an expert prompt engineer for adult fictional image generation workflows using Stable Diffusion and ComfyUI. Analyze the provided image and create a high-quality prompt based on visible visual evidence. Return only valid JSON. Do not include markdown. NSFW mode allows adult fictional consensual content only. Refuse and do not generate explicit prompts for minors, childlike appearance, young/teen/schoolgirl/loli/shota framing, coercion, sexual violence, real-person sexualization, deepfake, non-consensual nudity, incest or illegal content. If allowed, describe the image as adult fictional content and generate a structured prompt suitable for local responsible use.';

const BLOCKED_NSFW_TERMS = [
  'minor',
  'child',
  'childlike',
  'young',
  'teen',
  'schoolgirl',
  'loli',
  'shota',
  'coercion',
  'rape',
  'sexual violence',
  'real person',
  'deepfake',
  'non-consensual',
  'incest',
];

const createEmptyResult = (model: string, fallbackUsed: boolean, safetyNotes = ''): ImageAnalysisResult => ({
  description: '',
  style_analysis: '',
  character_details: '',
  composition: '',
  lighting: '',
  color_palette: '',
  background: '',
  mood: '',
  positive_prompt: '',
  negative_prompt: '',
  booru_tags: [],
  recommended_aspect_ratio: '',
  recommended_resolution: '',
  comfyui_notes: '',
  safety_notes: safetyNotes,
  model_used: model,
  fallback_used: fallbackUsed,
});

const stripDataUrlPrefix = (imageBase64: string): string => imageBase64.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, '');

const getKeepAlive = (settings: AppAISettings, type: 'prompt_lab' | 'chat'): string | number => {
  if (settings.lowMemoryMode) return 0;
  return type === 'prompt_lab' ? settings.keepAlivePromptLab : settings.keepAliveChat;
};

const friendlyModelError = (model: string): Error => {
  return new Error(`Ollama model "${model}" is not installed. Install it with: ollama run ${model}`);
};

const getModelBaseName = (model: string): string => model.split(':')[0].toLowerCase();

const findInstalledModel = (requestedModel: string, installedModels: string[]): string | null => {
  const requested = requestedModel.trim();
  if (!requested) return null;

  const exact = installedModels.find(model => model.toLowerCase() === requested.toLowerCase());
  if (exact) return requested;

  const latest = installedModels.find(model => model.toLowerCase() === `${requested.toLowerCase()}:latest`);
  if (latest) return requested;

  if (!requested.includes(':')) {
    const sameBaseName = installedModels.find(model => getModelBaseName(model) === requested.toLowerCase());
    if (sameBaseName) return requested;
  }

  return null;
};

const parseJsonResult = (text: string, model: string, fallbackUsed: boolean): ImageAnalysisResult => {
  const trimmed = text.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
  const parsed = JSON.parse(trimmed) as Partial<ImageAnalysisResult>;
  const toText = (value: unknown): string => {
    if (typeof value === 'string') return value;
    if (Array.isArray(value)) return value.map(item => toText(item)).filter(Boolean).join(', ');
    if (value && typeof value === 'object') {
      return Object.entries(value)
        .map(([key, item]) => `${key.replace(/_/g, ' ')}: ${toText(item)}`)
        .filter(Boolean)
        .join('\n');
    }
    if (value === null || value === undefined) return '';
    return String(value);
  };
  const toTags = (value: unknown): string[] => {
    if (Array.isArray(value)) return value.flatMap(item => toText(item).split(',')).map(tag => tag.trim()).filter(Boolean);
    return toText(value).split(',').map(tag => tag.trim()).filter(Boolean);
  };

  return {
    description: toText(parsed.description),
    style_analysis: toText(parsed.style_analysis),
    character_details: toText(parsed.character_details),
    composition: toText(parsed.composition),
    lighting: toText(parsed.lighting),
    color_palette: toText(parsed.color_palette),
    background: toText(parsed.background),
    mood: toText(parsed.mood),
    positive_prompt: toText(parsed.positive_prompt),
    negative_prompt: toText(parsed.negative_prompt),
    booru_tags: toTags(parsed.booru_tags),
    recommended_aspect_ratio: toText(parsed.recommended_aspect_ratio),
    recommended_resolution: toText(parsed.recommended_resolution),
    comfyui_notes: toText(parsed.comfyui_notes),
    safety_notes: toText(parsed.safety_notes),
    model_used: model,
    fallback_used: fallbackUsed,
  };
};

export const modelLikelySupportsVision = (model: string): boolean => {
  const normalized = model.toLowerCase();
  return [
    'llava',
    'bakllava',
    'moondream',
    'minicpm-v',
    'qwen-vl',
    'qwen2-vl',
    'qwen2.5vl',
    'llama3.2-vision',
    'llama3.2-vision',
    'gemma3',
    'gemma4',
    'vision',
    'vl',
  ].some(marker => normalized.includes(marker));
};

const containsBlockedNsfwTerm = (value: string): boolean => {
  const normalized = value.toLowerCase();
  return BLOCKED_NSFW_TERMS.some(term => normalized.includes(term));
};

const validateSafety = (request: ImageAnalysisRequest, result: ImageAnalysisResult): ImageAnalysisResult => {
  const userText = [request.customInstruction || '', result.description, result.character_details, result.positive_prompt, result.booru_tags.join(' ')].join(' ');
  if (request.mode === 'nsfw' && containsBlockedNsfwTerm(userText)) {
    return {
      ...result,
      positive_prompt: '',
      safety_notes: result.safety_notes || 'Blocked by local safety rules for minors, coercion, real-person sexualization, or illegal content.',
    };
  }
  return result;
};

const postJson = async <T,>(url: string, body: Record<string, unknown>): Promise<T> => {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await response.json() as T & { error?: string };
  if (!response.ok || data.error) {
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }
  return data;
};

export const imageUrlToBase64 = async (imageUrl: string): Promise<string> => {
  const normalized = imageUrl.startsWith('//') ? `https:${imageUrl}` : imageUrl;
  const fetchUrl = normalized.startsWith('http') ? `/api/proxy-image?url=${encodeURIComponent(normalized)}` : normalized;
  const response = await fetch(fetchUrl);
  if (!response.ok) {
    throw new Error('Could not read this image for AI analysis. The source may block hotlinking or CORS.');
  }
  const blob = await response.blob();
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Could not convert image to base64.'));
    reader.readAsDataURL(blob);
  });
};

export const checkOllamaHealth = async (): Promise<boolean> => {
  const settings = getSettings();
  try {
    const response = await fetch(`/api/ollama/health?baseUrl=${encodeURIComponent(settings.ollamaBaseUrl)}`);
    const online = response.ok;
    localAIExecutionManager.setOllamaOnline(online);
    return online;
  } catch {
    localAIExecutionManager.setOllamaOnline(false);
    return false;
  }
};

export const getInstalledOllamaModels = async (): Promise<string[]> => {
  const settings = getSettings();
  const response = await fetch(`/api/ollama/models?baseUrl=${encodeURIComponent(settings.ollamaBaseUrl)}`);
  if (!response.ok) return [];
  const data = await response.json() as OllamaModelsResponse;
  return (data.models || []).map(model => model.name || model.model || '').filter(Boolean);
};

export const resolveModelForMode = (mode: PromptMode, settings: AppAISettings): string => {
  return mode === 'sfw' ? settings.ollamaSfwModel : settings.ollamaNsfwModel;
};

export const resolveModelForChatMode = (chatMode: ChatMode, settings: AppAISettings): string => {
  if (settings.ollamaDefaultChatModel !== 'auto') return settings.ollamaDefaultChatModel;
  if (chatMode === 'nsfw') return settings.ollamaNsfwModel;
  if (chatMode === 'dev' || chatMode === 'comfyui_helper' || chatMode === 'prompt_engineering') return settings.ollamaSfwModel;
  return settings.ollamaSfwModel;
};

export const analyzeImageWithOllama = async (request: ImageAnalysisRequest): Promise<ImageAnalysisResult> => {
  const settings = getSettings();
  const installedModels = await getInstalledOllamaModels();
  const preferred = request.preferredModel && request.preferredModel !== 'auto'
    ? request.preferredModel
    : resolveModelForMode(request.mode, settings);
  const installedPreferred = findInstalledModel(preferred, installedModels);
  const installedFallback = findInstalledModel(settings.ollamaFallbackModel, installedModels);
  const model = installedPreferred || installedFallback || settings.ollamaFallbackModel;
  const fallbackUsed = model !== preferred;

  if (!installedPreferred && !installedFallback) {
    throw friendlyModelError(model);
  }

  if (!localAIExecutionManager.canRunOllamaTask()) {
    throw new Error('Local AI is blocked while ComfyUI or another Ollama task is running.');
  }

  localAIExecutionManager.startOllamaTask('prompt_lab', model);
  try {
    const system = `${request.mode === 'nsfw' ? NSFW_SYSTEM_PROMPT : SFW_SYSTEM_PROMPT}\n\n${PROMPT_TEMPLATE_SYSTEM_PROMPT}`;
    const prompt = `Analyze the attached image for a ComfyUI prompt workflow.

Mode: ${request.mode}
Target checkpoint: ${request.targetCheckpoint || settings.defaultTargetCheckpoint}
Checkpoint prompt preset: ${request.checkpointPreset || request.targetCheckpoint || settings.defaultTargetCheckpoint}
Custom instruction: ${request.customInstruction || 'none'}

Return only valid JSON with these exact fields:
description, style_analysis, character_details, composition, lighting, color_palette, background, mood, positive_prompt, negative_prompt, booru_tags, recommended_aspect_ratio, recommended_resolution, comfyui_notes, safety_notes.

Do not include markdown. Do not include explanations outside JSON. Base the prompt on visible elements only.`;

    const data = await postJson<OllamaGenerateResponse>('/api/ollama/analyze-image', {
      baseUrl: settings.ollamaBaseUrl,
      model,
      system,
      prompt,
      images: [stripDataUrlPrefix(request.imageBase64)],
      keep_alive: getKeepAlive(settings, 'prompt_lab'),
      format: 'json',
    });

    const result = parseJsonResult(data.response || '{}', model, fallbackUsed);
    return validateSafety(request, result);
  } finally {
    localAIExecutionManager.finishOllamaTask();
    if (settings.autoUnloadAfterRequest || settings.lowMemoryMode) {
      await unloadOllamaModel(model).catch(() => undefined);
    }
  }
};

export const refinePromptWithOllama = async (prompt: string, instruction: string, mode: PromptMode): Promise<string> => {
  const settings = getSettings();
  const model = resolveModelForMode(mode, settings);
  if (!localAIExecutionManager.canRunOllamaTask()) throw new Error('Local AI is busy.');
  localAIExecutionManager.startOllamaTask('prompt_lab', model);
  try {
    const data = await postJson<OllamaGenerateResponse>('/api/ollama/analyze-image', {
      baseUrl: settings.ollamaBaseUrl,
      model,
      system: mode === 'nsfw' ? NSFW_SYSTEM_PROMPT : SFW_SYSTEM_PROMPT,
      prompt: `Refine this Stable Diffusion prompt. Instruction: ${instruction}\n\nPrompt:\n${prompt}\n\nReturn only the improved prompt text.`,
      keep_alive: getKeepAlive(settings, 'prompt_lab'),
    });
    return (data.response || '').trim();
  } finally {
    localAIExecutionManager.finishOllamaTask();
    if (settings.autoUnloadAfterRequest || settings.lowMemoryMode) await unloadOllamaModel(model).catch(() => undefined);
  }
};

export const generatePromptVariations = async (prompt: string, count: number, mode: PromptMode): Promise<string[]> => {
  const settings = getSettings();
  const model = resolveModelForMode(mode, settings);
  const cappedCount = Math.min(Math.max(count, 1), settings.maxPromptVariationsPerRequest);
  if (!localAIExecutionManager.canRunOllamaTask()) throw new Error('Local AI is busy.');
  localAIExecutionManager.startOllamaTask('prompt_lab', model);
  try {
    const data = await postJson<OllamaGenerateResponse>('/api/ollama/analyze-image', {
      baseUrl: settings.ollamaBaseUrl,
      model,
      system: mode === 'nsfw' ? NSFW_SYSTEM_PROMPT : SFW_SYSTEM_PROMPT,
      prompt: `Create ${cappedCount} concise Stable Diffusion prompt variations from this prompt. Return one variation per line.\n\n${prompt}`,
      keep_alive: getKeepAlive(settings, 'prompt_lab'),
    });
    return (data.response || '').split('\n').map(line => line.replace(/^\d+[\).:-]\s*/, '').trim()).filter(Boolean).slice(0, cappedCount);
  } finally {
    localAIExecutionManager.finishOllamaTask();
    if (settings.autoUnloadAfterRequest || settings.lowMemoryMode) await unloadOllamaModel(model).catch(() => undefined);
  }
};

export const unloadOllamaModel = async (model: string): Promise<void> => {
  const settings = getSettings();
  if (!model || model === 'auto') return;
  await postJson('/api/ollama/unload', {
    baseUrl: settings.ollamaBaseUrl,
    model,
  });
};
