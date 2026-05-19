import type { CheckpointType, PromptTemplatePreset } from '../types/ai.types';

const CUSTOM_PRESETS_KEY = 'wv_prompt_template_presets';

export const promptTemplateRegistry: Record<CheckpointType, PromptTemplatePreset> = {
  sdxl: {
    id: 'sdxl',
    label: 'SDXL',
    description: 'Hybrid prompts for SDXL and generic SDXL finetunes.',
    promptStyle: 'hybrid',
    supportsNegativePrompt: true,
    prefersNegativePrompt: true,
    supportsWeights: true,
    recommendedPositiveStructure: ['subject', 'action / pose', 'environment', 'composition', 'camera / lens', 'lighting', 'mood', 'style / medium', 'quality/details'],
    recommendedNegativeStructure: ['quality defects', 'anatomy defects', 'text/watermark artifacts'],
    qualityPrefix: ['highly detailed', 'sharp focus', 'cinematic composition'],
    ratingTags: [],
    sourceTags: [],
    styleTags: ['cinematic composition', 'sharp focus', 'highly detailed'],
    defaultNegativePrompt: 'low quality, blurry, distorted, bad anatomy, extra fingers, missing fingers, deformed hands, bad proportions, watermark, text, logo, jpeg artifacts',
    promptBuilderRules: ['Use natural language plus compact tags.', 'Do not use Pony score tags.', 'Keep negative prompt short and specific.'],
    examplePositivePrompt: 'adult fantasy heroine, standing on a ruined castle balcony, cinematic low angle, 35mm lens, dramatic sunset lighting, dark fantasy key art, highly detailed, sharp focus, cinematic composition',
    exampleNegativePrompt: 'low quality, blurry, distorted, bad anatomy, watermark, text, logo',
    recommendedSettings: { steps: '25-35', cfg: '5-7', sampler: 'DPM++ 2M', scheduler: 'Karras', resolution: '1024x1024 / 1216x832' },
  },
  pony: {
    id: 'pony',
    label: 'Pony Diffusion XL',
    description: 'Booru tag prompts for Pony Diffusion XL and Pony-based checkpoints.',
    promptStyle: 'booru_tags',
    supportsNegativePrompt: true,
    prefersNegativePrompt: false,
    supportsWeights: true,
    recommendedPositiveStructure: ['score tags', 'source tags', 'rating tag', 'subject tags', 'body/outfit tags', 'pose/action tags', 'composition tags', 'style tags', 'environment tags'],
    recommendedNegativeStructure: ['simple quality defects', 'simple anatomy defects', 'blocked safety tags'],
    qualityPrefix: ['score_9', 'score_8_up', 'score_7_up'],
    ratingTags: ['rating_safe', 'rating_questionable', 'rating_explicit'],
    sourceTags: ['source_anime', 'source_cartoon', 'source_furry', 'source_pony', 'source_comic'],
    styleTags: ['detailed', 'anime style'],
    defaultNegativePrompt: 'low quality, worst quality, blurry, deformed, bad anatomy, extra digits, watermark, text, logo, child, young, teen, loli, shota',
    promptBuilderRules: ['Score tags always first.', 'Use source_anime unless another source is clearly selected.', 'Do not use masterpiece/best quality as the default Pony quality prefix.'],
    examplePositivePrompt: 'score_9, score_8_up, score_7_up, source_anime, rating_safe, 1girl, adult, long hair, detailed eyes, standing, looking at viewer, fantasy outfit, castle background, anime style',
    exampleNegativePrompt: 'low quality, worst quality, blurry, deformed, bad anatomy, extra digits, watermark, text, logo',
    recommendedSettings: { steps: '25-35', cfg: '5-7', sampler: 'Euler a / DPM++ 2M', scheduler: 'Karras', resolution: '1024x1024' },
  },
  illustrious: {
    id: 'illustrious',
    label: 'Illustrious XL',
    description: 'Danbooru-style prompts for Illustrious XL and related finetunes.',
    promptStyle: 'hybrid',
    supportsNegativePrompt: true,
    prefersNegativePrompt: true,
    supportsWeights: true,
    recommendedPositiveStructure: ['quality tags', 'subject count', 'subject/body/outfit tags', 'pose/action', 'expression', 'composition/camera', 'background', 'lighting', 'style/rendering tags'],
    recommendedNegativeStructure: ['quality defects', 'anatomy defects', 'crop/blur artifacts', 'blocked safety tags'],
    qualityPrefix: ['masterpiece', 'best quality', 'very aesthetic', 'absurdres'],
    ratingTags: [],
    sourceTags: [],
    styleTags: ['anime style', 'detailed illustration', 'beautiful lighting'],
    defaultNegativePrompt: 'lowres, worst quality, low quality, normal quality, bad anatomy, bad hands, extra fingers, missing fingers, deformed, cropped, blurry, watermark, text, logo, jpeg artifacts, child, young, teen, loli, shota',
    promptBuilderRules: ['Use Danbooru tags first.', 'A short helper phrase is allowed.', 'Do not use Pony source tags by default.'],
    examplePositivePrompt: 'masterpiece, best quality, very aesthetic, absurdres, 1girl, adult, long hair, blue eyes, fantasy dress, standing, serious expression, from below, castle, sunset, dramatic lighting, anime style',
    exampleNegativePrompt: 'lowres, worst quality, low quality, bad anatomy, bad hands, watermark, text, logo',
    recommendedSettings: { steps: '28-35', cfg: '5-7', sampler: 'DPM++ 2M', scheduler: 'Karras', resolution: '1024x1024' },
  },
  animagine: {
    id: 'animagine',
    label: 'Animagine XL',
    description: 'Anime/Danbooru tag prompts for Animagine XL models.',
    promptStyle: 'booru_tags',
    supportsNegativePrompt: true,
    prefersNegativePrompt: true,
    supportsWeights: true,
    recommendedPositiveStructure: ['quality tags', 'rating tag', 'year/style tags', 'subject count', 'body/outfit tags', 'pose/action', 'expression', 'background', 'lighting', 'style'],
    recommendedNegativeStructure: ['quality defects', 'anatomy defects', 'crop/blur artifacts', 'blocked safety tags'],
    qualityPrefix: ['masterpiece', 'best quality', 'very aesthetic', 'absurdres'],
    ratingTags: ['safe', 'sensitive', 'questionable', 'explicit'],
    sourceTags: [],
    styleTags: ['anime style', 'detailed illustration'],
    defaultNegativePrompt: 'lowres, worst quality, low quality, bad anatomy, bad hands, extra fingers, missing fingers, blurry, cropped, watermark, text, logo, child, young, teen, loli, shota',
    promptBuilderRules: ['Use Danbooru tags.', 'Use safe for SFW and explicit only for allowed adult fictional NSFW.', 'Do not use score_9 unless Pony is selected.'],
    examplePositivePrompt: 'masterpiece, best quality, very aesthetic, absurdres, safe, 1girl, adult, long hair, blue eyes, fantasy outfit, standing, looking at viewer, castle, sunset, anime style',
    exampleNegativePrompt: 'lowres, worst quality, low quality, bad anatomy, bad hands, blurry, watermark, text, logo',
    recommendedSettings: { steps: '25-32', cfg: '5-7', sampler: 'Euler a / DPM++ 2M', scheduler: 'Karras', resolution: '1024x1024' },
  },
  flux: {
    id: 'flux',
    label: 'FLUX',
    description: 'Natural-language prompts for FLUX.1 dev, schnell, and compatible workflows.',
    promptStyle: 'natural_language',
    supportsNegativePrompt: true,
    prefersNegativePrompt: false,
    supportsWeights: false,
    recommendedPositiveStructure: ['clear main sentence', 'subject details', 'action/pose', 'environment', 'composition/camera', 'lighting', 'visual style', 'materials/textures', 'atmosphere'],
    recommendedNegativeStructure: ['only workflow-supported concise negatives'],
    qualityPrefix: [],
    ratingTags: [],
    sourceTags: [],
    styleTags: ['cinematic photo', 'anime key visual', 'editorial portrait', 'concept art'],
    defaultNegativePrompt: 'blurry, low quality, distorted, watermark, text, logo',
    promptBuilderRules: ['Use clear natural language.', 'Do not use score tags.', 'Avoid pure booru tag lists.', 'For schnell, keep it direct.'],
    examplePositivePrompt: 'A cinematic fantasy image of an adult woman with long silver hair standing before an ancient castle at dusk. The composition is a low-angle portrait with dramatic rim lighting, cool shadows, warm sunset highlights, and detailed stone textures. High detail, coherent anatomy, strong prompt adherence.',
    exampleNegativePrompt: 'blurry, low quality, distorted, watermark, text, logo',
    recommendedSettings: { steps: '4-8 schnell / 20-30 dev', cfg: '1-3.5', sampler: 'Euler / workflow default', scheduler: 'Simple / workflow default', resolution: '1024x1024 / 1344x768' },
  },
  z_image: {
    id: 'z_image',
    label: 'Z-Image',
    description: 'Structured long captions for Z-Image base workflows.',
    promptStyle: 'structured_caption',
    supportsNegativePrompt: true,
    prefersNegativePrompt: true,
    supportsWeights: false,
    recommendedPositiveStructure: ['subject and action', 'visual identity', 'environment', 'composition', 'lighting', 'materials/textures', 'style/medium', 'quality/fidelity', 'constraints'],
    recommendedNegativeStructure: ['quality defects', 'anatomy defects', 'watermark/text artifacts', 'composition issues'],
    qualityPrefix: [],
    ratingTags: [],
    sourceTags: [],
    styleTags: ['highly detailed', 'rich texture', 'strong visual clarity'],
    defaultNegativePrompt: 'low quality, blurry, distorted anatomy, malformed hands, watermark, text artifacts, logo, messy composition',
    promptBuilderRules: ['Use long specific captions.', 'Prioritize composition, light, texture and spatial relationships.', 'Avoid pure booru tags and score tags.'],
    examplePositivePrompt: 'A highly detailed cinematic illustration of an adult fantasy heroine standing before a ruined castle, framed in a balanced low-angle composition with warm dusk lighting, cool shadows, rich fabric textures, weathered stone, coherent anatomy, and strong visual clarity.',
    exampleNegativePrompt: 'low quality, blurry, distorted anatomy, malformed hands, watermark, text artifacts, logo, messy composition',
    recommendedSettings: { steps: '20-30', cfg: 'workflow default', sampler: 'workflow default', scheduler: 'workflow default', resolution: '1024x1024' },
  },
  z_image_turbo: {
    id: 'z_image_turbo',
    label: 'Z-Image Turbo',
    description: 'Structured natural-language prompts for Z-Image Turbo without traditional negative prompts.',
    promptStyle: 'structured_caption',
    supportsNegativePrompt: false,
    prefersNegativePrompt: false,
    supportsWeights: false,
    recommendedPositiveStructure: ['subject', 'action', 'environment', 'composition', 'lighting', 'texture/material', 'style', 'explicit positive constraints'],
    recommendedNegativeStructure: [],
    qualityPrefix: [],
    ratingTags: [],
    sourceTags: [],
    styleTags: ['highly detailed', 'clean composition', 'coherent anatomy'],
    defaultNegativePrompt: '',
    promptBuilderRules: ['Do not generate a negative prompt by default.', 'Convert negatives into positive constraints.', 'Avoid loose tags, score tags and Danbooru-only prompts.'],
    examplePositivePrompt: 'A highly detailed cinematic illustration showing an adult fantasy heroine standing before an ancient castle at dusk. Compose the scene with a clean low-angle portrait, dramatic rim lighting, warm sunset colors, detailed fabric and stone textures, coherent anatomy, naturally posed hands, and a clean intentional background without visible text or watermark-like markings.',
    exampleNegativePrompt: '',
    recommendedSettings: { steps: '4-8', cfg: 'workflow default', sampler: 'workflow default', scheduler: 'workflow default', resolution: '1024x1024' },
  },
  anime_generic: {
    id: 'anime_generic',
    label: 'Anime Generic',
    description: 'Broad booru/hybrid fallback for unknown anime checkpoints.',
    promptStyle: 'hybrid',
    supportsNegativePrompt: true,
    prefersNegativePrompt: true,
    supportsWeights: true,
    recommendedPositiveStructure: ['quality tags', 'subject count', 'subject tags', 'hair/eyes/body', 'outfit', 'pose', 'expression', 'background', 'lighting', 'anime style'],
    recommendedNegativeStructure: ['quality defects', 'anatomy defects', 'blur/crop artifacts', 'watermark/text'],
    qualityPrefix: ['masterpiece', 'best quality', 'highres'],
    ratingTags: [],
    sourceTags: [],
    styleTags: ['anime style', 'detailed illustration'],
    defaultNegativePrompt: 'lowres, worst quality, low quality, bad anatomy, bad hands, extra fingers, missing fingers, blurry, cropped, watermark, text, logo',
    promptBuilderRules: ['Use broad booru tags.', 'Do not use score tags unless Pony is selected.', 'Avoid model-specific rating tags unless known.'],
    examplePositivePrompt: 'masterpiece, best quality, highres, 1girl, adult, long hair, blue eyes, fantasy outfit, standing, serious expression, castle background, dramatic lighting, anime style, detailed illustration',
    exampleNegativePrompt: 'lowres, worst quality, low quality, bad anatomy, bad hands, blurry, watermark, text, logo',
    recommendedSettings: { steps: '25-35', cfg: '5-8', sampler: 'DPM++ 2M / Euler a', scheduler: 'Karras', resolution: '768x1024 / 1024x1024' },
  },
  realistic_generic: {
    id: 'realistic_generic',
    label: 'Realistic Generic',
    description: 'Photographic language for realistic SDXL finetunes.',
    promptStyle: 'natural_language',
    supportsNegativePrompt: true,
    prefersNegativePrompt: true,
    supportsWeights: true,
    recommendedPositiveStructure: ['realistic subject', 'pose/action', 'environment', 'camera/lens', 'lighting', 'color grading', 'skin/material texture', 'composition', 'photographic quality'],
    recommendedNegativeStructure: ['artificial medium', 'quality defects', 'anatomy defects', 'overprocessing', 'watermark/text'],
    qualityPrefix: ['realistic photograph', 'highly detailed', 'natural proportions'],
    ratingTags: [],
    sourceTags: [],
    styleTags: ['realistic photograph', 'shallow depth of field', 'natural light'],
    defaultNegativePrompt: 'cgi, 3d render, cartoon, anime, painting, low quality, blurry, distorted, bad anatomy, plastic skin, overprocessed, watermark, text, logo',
    promptBuilderRules: ['Use photographic language.', 'Include camera/lens/light.', 'Avoid anime terms when realism is the target.'],
    examplePositivePrompt: 'A realistic photograph of an adult woman standing near an old stone castle at dusk, 85mm portrait lens, soft rim light, cinematic color grading, natural skin texture, shallow depth of field, highly detailed, natural proportions',
    exampleNegativePrompt: 'cgi, 3d render, cartoon, anime, painting, low quality, blurry, distorted, plastic skin, watermark, text, logo',
    recommendedSettings: { steps: '25-35', cfg: '4-7', sampler: 'DPM++ 2M', scheduler: 'Karras', resolution: '1024x1024 / 832x1216' },
  },
  custom: {
    id: 'custom',
    label: 'Custom Checkpoint',
    description: 'User-configurable preset placeholder.',
    promptStyle: 'hybrid',
    supportsNegativePrompt: true,
    prefersNegativePrompt: true,
    supportsWeights: true,
    recommendedPositiveStructure: ['custom positive prefix', 'subject', 'style', 'composition', 'quality'],
    recommendedNegativeStructure: ['custom negative prefix'],
    qualityPrefix: [],
    ratingTags: [],
    sourceTags: [],
    styleTags: [],
    defaultNegativePrompt: 'low quality, blurry, watermark, text',
    promptBuilderRules: ['Use the user configured style and prefixes.'],
    examplePositivePrompt: 'custom preset prefix, subject, composition, style, quality',
    exampleNegativePrompt: 'custom negative prefix, low quality, blurry',
    recommendedSettings: {},
  },
};

export const getPromptTemplatePreset = (id: CheckpointType | string): PromptTemplatePreset => {
  const custom = getCustomPromptTemplatePresets().find(preset => preset.id === id);
  if (custom) return custom;
  return promptTemplateRegistry[id as CheckpointType] || promptTemplateRegistry.sdxl;
};

export const getAllPromptTemplatePresets = (): PromptTemplatePreset[] => [
  ...Object.values(promptTemplateRegistry),
  ...getCustomPromptTemplatePresets(),
];

export const getCustomPromptTemplatePresets = (): PromptTemplatePreset[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(CUSTOM_PRESETS_KEY);
    const parsed = raw ? JSON.parse(raw) as PromptTemplatePreset[] : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const saveCustomPromptTemplatePreset = (preset: PromptTemplatePreset): void => {
  if (typeof window === 'undefined') return;
  const custom = getCustomPromptTemplatePresets().filter(item => item.id !== preset.id);
  window.localStorage.setItem(CUSTOM_PRESETS_KEY, JSON.stringify([preset, ...custom]));
};

export const deleteCustomPromptTemplatePreset = (id: string): void => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(CUSTOM_PRESETS_KEY, JSON.stringify(getCustomPromptTemplatePresets().filter(item => item.id !== id)));
};
