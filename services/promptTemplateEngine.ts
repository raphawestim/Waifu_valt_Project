import type {
  CheckpointType,
  ImageAnalysisResult,
  PromptBuildInput,
  PromptBuildResult,
  PromptConversionInput,
  PromptMode,
} from '../types/ai.types';
import { getPromptTemplatePreset } from './promptTemplateRegistry';

const BLOCKED_NSFW_TERMS = ['minor', 'child', 'childlike', 'young', 'teen', 'schoolgirl', 'loli', 'shota', 'coercion', 'rape', 'sexual violence', 'abuse', 'deepfake', 'real person', 'non-consensual', 'incest'];
const PONY_SCORE_TAGS = ['score_9', 'score_8_up', 'score_7_up', 'score_6_up'];
const PONY_SOURCE_TAGS = ['source_anime', 'source_cartoon', 'source_furry', 'source_pony', 'source_comic'];
const PONY_RATING_TAGS = ['rating_safe', 'rating_questionable', 'rating_explicit'];
const ANIMAGINE_RATING_TAGS = ['safe', 'sensitive', 'questionable', 'explicit'];
const QUALITY_TAGS = ['masterpiece', 'best quality', 'very aesthetic', 'absurdres', 'highres'];

export const PROMPT_TEMPLATE_SYSTEM_PROMPT = 'You are an expert ComfyUI prompt engineer. You generate prompts differently depending on the selected checkpoint family. Do not use one universal prompt style. Follow the selected preset strictly. For SDXL, use hybrid natural language with concise negative prompts. For Pony, use booru tags with score tags at the beginning. For Illustrious, use Danbooru-style tags with quality tags. For Animagine, use anime/Danbooru-style tags with appropriate rating tags. For FLUX, use clear natural language and strong visual descriptions. For Z-Image, use structured long captions with emphasis on composition, light, texture and spatial coherence. For Z-Image-Turbo, do not rely on negative prompts; convert unwanted elements into positive constraints. For anime generic, use broad booru tags. For realistic generic, use photographic language. Return only the requested structure. Do not include markdown unless asked.';

const cleanText = (value?: string): string => (value || '').replace(/\s+/g, ' ').trim();

const splitTags = (value: string): string[] => value
  .split(',')
  .map(tag => tag.trim().replace(/\s+/g, '_'))
  .filter(Boolean);

const uniq = (items: string[]): string[] => [...new Set(items.map(item => item.trim()).filter(Boolean))];

const hasBlockedNsfw = (input: PromptBuildInput | PromptConversionInput): boolean => {
  if (input.mode !== 'nsfw') return false;
  const haystack = [
    'imageAnalysis' in input ? input.imageAnalysis?.description : '',
    'imageAnalysis' in input ? input.imageAnalysis?.character_details : '',
    'imageAnalysis' in input ? input.imageAnalysis?.positive_prompt : '',
    'userIdea' in input ? input.userIdea : '',
    'customInstruction' in input ? input.customInstruction : '',
    'sourcePrompt' in input ? input.sourcePrompt : '',
  ].join(' ').toLowerCase();
  return BLOCKED_NSFW_TERMS.some(term => haystack.includes(term));
};

const analysisToTags = (analysis?: ImageAnalysisResult, userIdea?: string): string[] => {
  const directTags = analysis?.booru_tags || [];
  const derived = [
    analysis?.character_details,
    analysis?.composition,
    analysis?.lighting,
    analysis?.background,
    analysis?.mood,
    userIdea,
  ].flatMap(value => splitTags(cleanText(value)));

  return uniq([...directTags, ...derived])
    .map(tag => tag.toLowerCase())
    .filter(tag => !tag.includes('[object_object]'))
    .slice(0, 45);
};

const summaryFromAnalysis = (analysis?: ImageAnalysisResult, userIdea?: string): string => {
  return cleanText([
    userIdea,
    analysis?.description,
    analysis?.character_details,
    analysis?.composition,
    analysis?.lighting,
    analysis?.color_palette,
    analysis?.background,
    analysis?.mood,
    analysis?.style_analysis,
  ].filter(Boolean).join('. '));
};

const removePresetSpecificTags = (tags: string[]): string[] => uniq(tags.filter(tag => {
  const lower = tag.toLowerCase();
  return !PONY_SCORE_TAGS.includes(lower)
    && !PONY_SOURCE_TAGS.includes(lower)
    && !PONY_RATING_TAGS.includes(lower)
    && !ANIMAGINE_RATING_TAGS.includes(lower);
}));

const ensureAdultTag = (mode: PromptMode, tags: string[]): string[] => {
  if (mode !== 'nsfw') return tags;
  return uniq(['adult', 'mature', ...tags]);
};

const buildBooruPrompt = (prefix: string[], tags: string[], styleTags: string[]): string => uniq([...prefix, ...tags, ...styleTags]).join(', ');

const buildNaturalPrompt = (input: PromptBuildInput, flavor: 'flux' | 'z_image' | 'z_image_turbo' | 'realistic'): string => {
  const analysis = input.imageAnalysis;
  const subject = cleanText(input.userIdea || analysis?.description || 'an adult fictional character');
  const character = cleanText(analysis?.character_details || subject);
  const environment = cleanText(analysis?.background || 'a visually coherent environment');
  const composition = cleanText(analysis?.composition || 'a balanced composition');
  const lighting = cleanText(analysis?.lighting || 'intentional cinematic lighting');
  const mood = cleanText(analysis?.mood || 'a clear atmospheric mood');
  const colors = cleanText(analysis?.color_palette || 'a cohesive color palette');
  const style = cleanText(input.stylePreference || analysis?.style_analysis || 'detailed digital art');

  if (flavor === 'realistic') {
    return `A realistic photograph of ${character}, ${composition}, in ${environment}, shot with photographic camera language and natural perspective, ${lighting}, ${colors}, natural skin and material texture, shallow depth of field, highly detailed, natural proportions.`;
  }

  if (flavor === 'z_image_turbo') {
    return `A highly detailed ${style} showing ${character} in ${environment}. Compose the scene with ${composition}. Use ${lighting} and ${colors}. Show detailed textures and clear spatial relationships. Keep anatomy coherent, hands naturally posed, avoid visual clutter, avoid visible text or watermark-like markings, and keep the background clean and intentional.`;
  }

  if (flavor === 'z_image') {
    return `A highly detailed ${style} of ${character}, set in ${environment}. The scene features ${composition}, ${lighting}, ${colors}, rich material and texture details, and ${mood}. Emphasize coherent anatomy, precise object relationships, rich texture, and strong visual clarity.`;
  }

  return `A ${style} image of ${character} in ${environment}. The composition is ${composition}. Lighting is ${lighting}. The mood is ${mood}. Include ${colors}, detailed materials, coherent anatomy, and strong prompt adherence.`;
};

const buildHybridSdxl = (input: PromptBuildInput): string => {
  const analysis = input.imageAnalysis;
  const tags = removePresetSpecificTags(analysisToTags(analysis, input.userIdea)).slice(0, 14);
  const summary = summaryFromAnalysis(analysis, input.userIdea);
  const base = summary || tags.join(', ') || 'adult fictional character, detailed scene';
  return `${base}, highly detailed, sharp focus, cinematic composition`;
};

export const inferCheckpointType = (value: string): CheckpointType => {
  const normalized = value.toLowerCase();
  if (normalized.includes('z-image') && normalized.includes('turbo')) return 'z_image_turbo';
  if (normalized.includes('zimage') && normalized.includes('turbo')) return 'z_image_turbo';
  if (normalized.includes('z-image') || normalized.includes('zimage')) return 'z_image';
  if (normalized.includes('pony')) return 'pony';
  if (normalized.includes('illustrious')) return 'illustrious';
  if (normalized.includes('animagine') || normalized.includes('anim4gine')) return 'animagine';
  if (normalized.includes('flux')) return 'flux';
  if (normalized.includes('realistic') || normalized.includes('realvis') || normalized.includes('juggernaut') || normalized.includes('photo')) return 'realistic_generic';
  if (normalized.includes('anime')) return 'anime_generic';
  return 'sdxl';
};

export const buildPromptForCheckpoint = (input: PromptBuildInput): PromptBuildResult => {
  const preset = getPromptTemplatePreset(input.checkpointType);
  if (hasBlockedNsfw(input)) {
    return {
      checkpointType: input.checkpointType,
      positivePrompt: '',
      negativePrompt: '',
      tags: [],
      templateUsed: preset.label,
      notes: 'Blocked by NSFW safety rules. Use adult fictional consensual content only; minors, childlike appearance, coercion, real persons, deepfake, incest and illegal content are not allowed.',
      recommendedSettings: preset.recommendedSettings,
    };
  }

  const baseTags = ensureAdultTag(input.mode, removePresetSpecificTags(analysisToTags(input.imageAnalysis, input.userIdea)));
  let tags = baseTags;
  let positivePrompt = '';
  let negativePrompt = input.includeNegativePrompt === false ? '' : preset.defaultNegativePrompt;

  if (input.checkpointType === 'pony') {
    const rating = input.mode === 'nsfw' ? 'rating_explicit' : 'rating_safe';
    tags = uniq([...preset.qualityPrefix, 'source_anime', rating, ...ensureAdultTag(input.mode, baseTags), ...preset.styleTags]);
    positivePrompt = buildBooruPrompt([], tags, []);
  } else if (input.checkpointType === 'illustrious') {
    tags = uniq([...preset.qualityPrefix, ...ensureAdultTag(input.mode, baseTags), ...preset.styleTags]);
    positivePrompt = buildBooruPrompt([], tags, []);
  } else if (input.checkpointType === 'animagine') {
    const rating = input.mode === 'nsfw' ? 'explicit' : 'safe';
    tags = uniq([...preset.qualityPrefix, rating, ...ensureAdultTag(input.mode, baseTags), ...preset.styleTags]);
    positivePrompt = buildBooruPrompt([], tags, []);
  } else if (input.checkpointType === 'anime_generic') {
    tags = uniq([...preset.qualityPrefix, ...ensureAdultTag(input.mode, baseTags), ...preset.styleTags]);
    positivePrompt = buildBooruPrompt([], tags, []);
  } else if (input.checkpointType === 'flux') {
    tags = baseTags;
    positivePrompt = buildNaturalPrompt(input, 'flux');
  } else if (input.checkpointType === 'z_image') {
    tags = baseTags;
    positivePrompt = buildNaturalPrompt(input, 'z_image');
  } else if (input.checkpointType === 'z_image_turbo') {
    tags = baseTags;
    positivePrompt = buildNaturalPrompt(input, 'z_image_turbo');
    negativePrompt = '';
  } else if (input.checkpointType === 'realistic_generic') {
    tags = baseTags;
    positivePrompt = buildNaturalPrompt(input, 'realistic');
  } else if (input.checkpointType === 'custom') {
    tags = uniq([...preset.qualityPrefix, ...baseTags, ...preset.styleTags]);
    positivePrompt = preset.promptStyle === 'natural_language' || preset.promptStyle === 'structured_caption'
      ? buildNaturalPrompt(input, 'flux')
      : buildBooruPrompt([], tags, []);
  } else {
    tags = baseTags;
    positivePrompt = buildHybridSdxl(input);
  }

  if (input.customInstruction) {
    positivePrompt = `${positivePrompt}, ${cleanText(input.customInstruction)}`;
  }

  return {
    checkpointType: input.checkpointType,
    positivePrompt: positivePrompt.replace(/\s+,/g, ',').trim(),
    negativePrompt: preset.supportsNegativePrompt ? negativePrompt : '',
    tags,
    templateUsed: preset.label,
    notes: `${preset.description} Rules: ${preset.promptBuilderRules.join(' ')}`,
    recommendedSettings: preset.recommendedSettings,
  };
};

export const convertPromptBetweenPresets = (input: PromptConversionInput): PromptBuildResult => {
  const sourceTags = splitTags(input.sourcePrompt);
  const cleanedTags = removePresetSpecificTags(sourceTags);
  const pseudoAnalysis: ImageAnalysisResult = {
    description: input.sourcePrompt,
    style_analysis: input.preserveStyle ? input.sourcePrompt : '',
    character_details: input.preserveSubject ? input.sourcePrompt : '',
    composition: input.preserveComposition ? input.sourcePrompt : '',
    lighting: '',
    color_palette: '',
    background: '',
    mood: '',
    positive_prompt: input.sourcePrompt,
    negative_prompt: '',
    booru_tags: cleanedTags,
    recommended_aspect_ratio: '',
    recommended_resolution: '',
    comfyui_notes: '',
    safety_notes: '',
    model_used: 'template-engine',
    fallback_used: false,
  };

  return buildPromptForCheckpoint({
    checkpointType: input.targetPreset,
    mode: input.mode,
    imageAnalysis: pseudoAnalysis,
    userIdea: input.targetPreset === 'flux' || input.targetPreset === 'z_image' || input.targetPreset === 'z_image_turbo' || input.targetPreset === 'realistic_generic'
      ? cleanedTags.join(', ').replace(/_/g, ' ')
      : undefined,
    includeNegativePrompt: input.targetPreset !== 'z_image_turbo',
  });
};

export const detectPresetFromCommand = (text: string): CheckpointType | null => {
  const normalized = text.toLowerCase();
  const aliases: Array<[CheckpointType, string[]]> = [
    ['z_image_turbo', ['z-image turbo', 'z image turbo', 'zimage turbo']],
    ['z_image', ['z-image', 'z image', 'zimage']],
    ['illustrious', ['illustrious']],
    ['animagine', ['animagine', 'anim4gine']],
    ['pony', ['pony']],
    ['flux', ['flux']],
    ['realistic_generic', ['realistic', 'realvis', 'photo']],
    ['anime_generic', ['anime generic', 'anime']],
    ['sdxl', ['sdxl']],
  ];

  return aliases.find(([, values]) => values.some(value => normalized.includes(value)))?.[0] || null;
};

export const formatPromptBuildResult = (result: PromptBuildResult): string => {
  const settings = result.recommendedSettings
    ? Object.entries(result.recommendedSettings).map(([key, value]) => `${key}: ${value}`).join(', ')
    : '';
  return [
    `Preset: ${result.templateUsed}`,
    `Positive prompt: ${result.positivePrompt}`,
    result.negativePrompt ? `Negative prompt: ${result.negativePrompt}` : 'Negative prompt: ',
    result.tags.length > 0 ? `Tags: ${result.tags.join(', ')}` : '',
    `Notes: ${result.notes}`,
    settings ? `Recommended settings: ${settings}` : '',
  ].filter(Boolean).join('\n\n');
};
