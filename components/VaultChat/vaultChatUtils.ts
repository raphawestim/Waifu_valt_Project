import type { ChatMode, ImageAnalysisResult, PromptHistoryItem, TargetCheckpoint } from '../../types/ai.types';

const blankAnalysis = (prompt: string, model: string): ImageAnalysisResult => ({
  description: '',
  style_analysis: '',
  character_details: '',
  composition: '',
  lighting: '',
  color_palette: '',
  background: '',
  mood: '',
  positive_prompt: prompt,
  negative_prompt: '',
  booru_tags: [],
  recommended_aspect_ratio: '',
  recommended_resolution: '',
  comfyui_notes: '',
  safety_notes: '',
  model_used: model,
  fallback_used: false,
});

export const emptyPromptHistoryFromPrompt = (prompt: string, mode: ChatMode, model: string): PromptHistoryItem => {
  const promptMode = mode === 'nsfw' ? 'nsfw' : 'sfw';
  const targetCheckpoint: TargetCheckpoint = 'generic';
  return {
    id: `chat-prompt-${Date.now()}`,
    createdAt: new Date().toISOString(),
    mode: promptMode,
    modelUsed: model,
    fallbackUsed: false,
    targetCheckpoint,
    positivePrompt: prompt,
    negativePrompt: '',
    tags: [],
    recommendedAspectRatio: '',
    recommendedResolution: '',
    fullAnalysisJson: blankAnalysis(prompt, model),
  };
};
