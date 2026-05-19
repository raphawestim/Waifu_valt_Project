export type PromptMode = 'sfw' | 'nsfw';

export type TargetCheckpoint =
  | 'sdxl'
  | 'illustrious'
  | 'pony'
  | 'animagine'
  | 'flux'
  | 'z_image'
  | 'z_image_turbo'
  | 'anime_generic'
  | 'realistic_generic'
  | 'custom'
  | 'realistic'
  | 'anime'
  | 'generic';

export type CheckpointType =
  | 'sdxl'
  | 'pony'
  | 'illustrious'
  | 'animagine'
  | 'flux'
  | 'z_image'
  | 'z_image_turbo'
  | 'anime_generic'
  | 'realistic_generic'
  | 'custom';

export type PromptStyle =
  | 'natural_language'
  | 'booru_tags'
  | 'hybrid'
  | 'structured_caption';

export type ChatMode =
  | 'sfw'
  | 'nsfw'
  | 'prompt_engineering'
  | 'comfyui_helper'
  | 'dev'
  | 'free';

export type ActiveTask = 'none' | 'comfyui' | 'prompt_lab' | 'vault_chat';

export interface PerformanceState {
  comfyuiOnline: boolean;
  comfyuiBusy: boolean;
  ollamaOnline: boolean;
  ollamaBusy: boolean;
  activeTask: ActiveTask;
  activeModel: string | null;
  lowMemoryMode: boolean;
}

export interface ImageAnalysisRequest {
  imageBase64: string;
  imageUrl?: string;
  imageId?: string;
  source?: string;
  mode: PromptMode;
  targetCheckpoint?: TargetCheckpoint;
  checkpointPreset?: CheckpointType;
  customInstruction?: string;
  preferredModel?: string;
}

export interface ImageAnalysisResult {
  description: string;
  style_analysis: string;
  character_details: string;
  composition: string;
  lighting: string;
  color_palette: string;
  background: string;
  mood: string;
  positive_prompt: string;
  negative_prompt: string;
  booru_tags: string[];
  recommended_aspect_ratio: string;
  recommended_resolution: string;
  comfyui_notes: string;
  safety_notes: string;
  model_used: string;
  fallback_used: boolean;
}

export interface OllamaModelConfig {
  sfwModel: string;
  nsfwModel: string;
  fallbackModel: string;
  defaultChatModel: string;
}

export interface ComfyUIStatus {
  online: boolean;
  busy: boolean;
  queueRunning: number;
  queuePending: number;
  lastCheckedAt: string;
  error: string | null;
}

export interface PromptHistoryItem {
  id: string;
  imageUrl?: string;
  imageId?: string;
  source?: string;
  thumbnailUrl?: string;
  createdAt: string;
  mode: PromptMode;
  modelUsed: string;
  fallbackUsed: boolean;
  targetCheckpoint: TargetCheckpoint;
  positivePrompt: string;
  negativePrompt: string;
  tags: string[];
  recommendedAspectRatio: string;
  recommendedResolution: string;
  fullAnalysisJson: ImageAnalysisResult;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  model?: string;
  attachments?: ChatContextAttachment[];
}

export interface ChatContextAttachment {
  type: 'image' | 'positive_prompt' | 'negative_prompt' | 'analysis' | 'history_item';
  data: string;
  label: string;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  mode: ChatMode;
  modelUsed: string;
  messages: ChatMessage[];
  linkedImageId?: string;
  linkedPromptId?: string;
}

export interface AppAISettings {
  ollamaBaseUrl: string;
  ollamaSfwModel: string;
  ollamaNsfwModel: string;
  ollamaFallbackModel: string;
  ollamaDefaultChatModel: string;
  comfyuiUrl: string;
  defaultMode: PromptMode;
  defaultTargetCheckpoint: TargetCheckpoint;
  vaultChatEnabled: boolean;
  vaultChatPosition: 'right' | 'left' | 'bottom';
  lowMemoryMode: boolean;
  comfyuiPriorityMode: boolean;
  blockOllamaWhenComfyuiBusy: boolean;
  keepAlivePromptLab: string;
  keepAliveChat: string;
  maxPromptVariationsPerRequest: number;
  maxChatHistoryInMemory: number;
  autoUnloadAfterRequest: boolean;
  comfyuiPollingActivMs: number;
  comfyuiPollingIdleMs: number;
}

export interface PromptTemplatePreset {
  id: CheckpointType | string;
  label: string;
  description: string;
  promptStyle: PromptStyle;
  supportsNegativePrompt: boolean;
  prefersNegativePrompt: boolean;
  supportsWeights: boolean;
  recommendedPositiveStructure: string[];
  recommendedNegativeStructure: string[];
  qualityPrefix: string[];
  ratingTags: string[];
  sourceTags: string[];
  styleTags: string[];
  defaultNegativePrompt: string;
  promptBuilderRules: string[];
  examplePositivePrompt: string;
  exampleNegativePrompt: string;
  recommendedSettings?: Record<string, string>;
}

export interface PromptBuildInput {
  checkpointType: CheckpointType;
  mode: PromptMode;
  imageAnalysis?: ImageAnalysisResult;
  userIdea?: string;
  customInstruction?: string;
  stylePreference?: string;
  includeNegativePrompt?: boolean;
  includeBooruTags?: boolean;
  outputFormat?: 'plain' | 'json' | 'comfyui_fields';
}

export interface PromptBuildResult {
  checkpointType: CheckpointType;
  positivePrompt: string;
  negativePrompt: string;
  tags: string[];
  templateUsed: string;
  notes: string;
  recommendedSettings?: Record<string, string>;
}

export interface PromptConversionInput {
  sourcePrompt: string;
  sourcePreset: CheckpointType;
  targetPreset: CheckpointType;
  mode: PromptMode;
  preserveSubject?: boolean;
  preserveComposition?: boolean;
  preserveStyle?: boolean;
}

export interface ComfyUIPromptPayload {
  positivePrompt: string;
  negativePrompt: string;
  width?: number;
  height?: number;
  checkpoint?: string;
  seed?: number;
  steps?: number;
  cfg?: number;
  sampler?: string;
  scheduler?: string;
}

export interface PromptLabImageContext {
  imageUrl: string;
  thumbnailUrl?: string;
  imageId?: string;
  source?: string;
  tags?: string[];
}
