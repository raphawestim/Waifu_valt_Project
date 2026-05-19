import React, { useEffect, useMemo, useState } from 'react';
import type { CheckpointType, ImageAnalysisResult, PromptBuildResult, PromptHistoryItem, PromptLabImageContext, PromptMode, TargetCheckpoint } from '../../types/ai.types';
import { LocalAIStatus, usePerformanceState } from '../AI/LocalAIStatus';
import { useAI } from '../AI/AIContext';
import { getSettings } from '../../services/settingsService';
import { analyzeImageWithOllama, generatePromptVariations, imageUrlToBase64, modelLikelySupportsVision, refinePromptWithOllama, unloadOllamaModel, resolveModelForMode } from '../../services/ollamaService';
import { getPromptHistory, savePromptHistoryItem, searchPromptHistory, deletePromptHistoryItem } from '../../services/promptHistoryService';
import { sendPromptToComfyUI } from '../../services/comfyuiService';
import { Spinner } from '../Spinner';
import { buildPromptForCheckpoint, convertPromptBetweenPresets, inferCheckpointType } from '../../services/promptTemplateEngine';
import { getAllPromptTemplatePresets } from '../../services/promptTemplateRegistry';

interface PromptLabViewProps {
  image: PromptLabImageContext | null;
  onNavigateHome: () => void;
  onNavigateComfyUI: () => void;
}

const emptyResult = (): ImageAnalysisResult => ({
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
  safety_notes: '',
  model_used: '',
  fallback_used: false,
});

const textFields: Array<keyof Omit<ImageAnalysisResult, 'booru_tags' | 'model_used' | 'fallback_used'>> = [
  'description',
  'style_analysis',
  'character_details',
  'composition',
  'lighting',
  'color_palette',
  'background',
  'mood',
  'positive_prompt',
  'negative_prompt',
  'recommended_aspect_ratio',
  'recommended_resolution',
  'comfyui_notes',
  'safety_notes',
];

const selectClass = 'w-full rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#151515] px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-violet-500';
const buttonClass = 'rounded-xl px-3 py-2 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-40';

const copyText = async (text: string): Promise<void> => {
  await navigator.clipboard?.writeText(text).catch(() => undefined);
};

const createHistoryItem = (
  result: ImageAnalysisResult,
  image: PromptLabImageContext | null,
  mode: PromptMode,
  targetCheckpoint: TargetCheckpoint,
): PromptHistoryItem => ({
  id: `prompt-${Date.now()}`,
  imageUrl: image?.imageUrl,
  thumbnailUrl: image?.thumbnailUrl,
  imageId: image?.imageId,
  source: image?.source,
  createdAt: new Date().toISOString(),
  mode,
  modelUsed: result.model_used,
  fallbackUsed: result.fallback_used,
  targetCheckpoint,
  positivePrompt: result.positive_prompt,
  negativePrompt: result.negative_prompt,
  tags: result.booru_tags,
  recommendedAspectRatio: result.recommended_aspect_ratio,
  recommendedResolution: result.recommended_resolution,
  fullAnalysisJson: result,
});

export const PromptLabView: React.FC<PromptLabViewProps> = ({ image, onNavigateHome, onNavigateComfyUI }) => {
  const settings = getSettings();
  const { sendToVaultChat, setPromptLabImage } = useAI();
  const performance = usePerformanceState();
  const [mode, setMode] = useState<PromptMode>(settings.defaultMode);
  const [targetCheckpoint, setTargetCheckpoint] = useState<TargetCheckpoint>(settings.defaultTargetCheckpoint);
  const [checkpointPreset, setCheckpointPreset] = useState<CheckpointType | 'auto'>('auto');
  const [modelOverride, setModelOverride] = useState('auto');
  const [customModel, setCustomModel] = useState('');
  const [customInstruction, setCustomInstruction] = useState('');
  const [result, setResult] = useState<ImageAnalysisResult>(emptyResult());
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [historyQuery, setHistoryQuery] = useState('');
  const [history, setHistory] = useState<PromptHistoryItem[]>([]);
  const [variations, setVariations] = useState<string[]>([]);
  const [promptBuildResult, setPromptBuildResult] = useState<PromptBuildResult | null>(null);

  const aiBlocked = performance.comfyuiBusy || performance.ollamaBusy;
  const preferredModel = modelOverride === 'custom' ? customModel : modelOverride;
  const effectiveModel = preferredModel === 'auto' ? resolveModelForMode(mode, settings) : preferredModel;
  const showVisionWarning = Boolean(effectiveModel) && !modelLikelySupportsVision(effectiveModel);
  const promptPresets = useMemo(() => getAllPromptTemplatePresets(), []);
  const resolvedCheckpointPreset = checkpointPreset === 'auto'
    ? inferCheckpointType(`${targetCheckpoint} ${customInstruction}`)
    : checkpointPreset;

  useEffect(() => {
    setHistory(getPromptHistory());
  }, []);

  useEffect(() => {
    setHistory(historyQuery ? searchPromptHistory(historyQuery) : getPromptHistory());
  }, [historyQuery]);

  const refreshHistory = () => setHistory(historyQuery ? searchPromptHistory(historyQuery) : getPromptHistory());

  const runAnalysis = async () => {
    if (!image?.imageUrl) {
      setError('Choose an image first. Open any image and send it to Prompt Lab.');
      return;
    }
    setError('');
    setStatus('Reading image and preparing local model...');
    setIsLoading(true);
    try {
      const imageBase64 = await imageUrlToBase64(image.imageUrl);
      const analysis = await analyzeImageWithOllama({
        imageBase64,
        imageUrl: image.imageUrl,
        imageId: image.imageId,
        source: image.source,
        mode,
        targetCheckpoint,
        checkpointPreset: resolvedCheckpointPreset,
        customInstruction,
        preferredModel,
      });
      const templated = buildPromptForCheckpoint({
        checkpointType: resolvedCheckpointPreset,
        mode,
        imageAnalysis: analysis,
        customInstruction,
        includeNegativePrompt: true,
        includeBooruTags: true,
        outputFormat: 'comfyui_fields',
      });
      const nextAnalysis = {
        ...analysis,
        positive_prompt: templated.positivePrompt,
        negative_prompt: templated.negativePrompt,
        booru_tags: templated.tags,
        comfyui_notes: [analysis.comfyui_notes, `Preset: ${templated.templateUsed}`, templated.notes].filter(Boolean).join('\n\n'),
      };
      setPromptBuildResult(templated);
      setResult(nextAnalysis);
      setStatus(`Generated with ${analysis.model_used}${analysis.fallback_used ? ' using fallback' : ''}. Preset: ${templated.templateUsed}.`);
    } catch (analysisError) {
      setError(analysisError instanceof Error ? analysisError.message : 'Prompt generation failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const saveHistory = () => {
    if (!result.positive_prompt && !result.description) return;
    savePromptHistoryItem(createHistoryItem(result, image, mode, targetCheckpoint));
    refreshHistory();
    setStatus('Saved to Prompt History.');
  };

  const sendToComfy = async () => {
    await sendPromptToComfyUI({
      positivePrompt: result.positive_prompt,
      negativePrompt: result.negative_prompt,
      checkpoint: resolvedCheckpointPreset,
    });
    onNavigateComfyUI();
  };

  const rebuildForPreset = (targetPreset: CheckpointType) => {
    const templated = buildPromptForCheckpoint({
      checkpointType: targetPreset,
      mode,
      imageAnalysis: result,
      customInstruction,
      includeNegativePrompt: true,
      includeBooruTags: true,
      outputFormat: 'comfyui_fields',
    });
    setCheckpointPreset(targetPreset);
    setPromptBuildResult(templated);
    setResult(prev => ({
      ...prev,
      positive_prompt: templated.positivePrompt,
      negative_prompt: templated.negativePrompt,
      booru_tags: templated.tags,
      comfyui_notes: [prev.comfyui_notes, `Converted to ${templated.templateUsed}`, templated.notes].filter(Boolean).join('\n\n'),
    }));
    setStatus(`Converted to ${templated.templateUsed}.`);
  };

  const convertCurrentPrompt = (targetPreset: CheckpointType) => {
    const converted = convertPromptBetweenPresets({
      sourcePrompt: result.positive_prompt,
      sourcePreset: resolvedCheckpointPreset,
      targetPreset,
      mode,
      preserveSubject: true,
      preserveComposition: true,
      preserveStyle: true,
    });
    setCheckpointPreset(targetPreset);
    setPromptBuildResult(converted);
    setResult(prev => ({
      ...prev,
      positive_prompt: converted.positivePrompt,
      negative_prompt: converted.negativePrompt,
      booru_tags: converted.tags,
      comfyui_notes: [prev.comfyui_notes, `Converted from ${resolvedCheckpointPreset} to ${converted.templateUsed}`, converted.notes].filter(Boolean).join('\n\n'),
    }));
  };

  const refine = async () => {
    setIsLoading(true);
    setError('');
    try {
      const refined = await refinePromptWithOllama(result.positive_prompt, customInstruction || 'Improve quality, clarity and checkpoint compatibility.', mode);
      setResult(prev => ({ ...prev, positive_prompt: refined }));
      setStatus('Positive prompt refined.');
    } catch (refineError) {
      setError(refineError instanceof Error ? refineError.message : 'Prompt refinement failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const generateVariations = async () => {
    setIsLoading(true);
    setError('');
    try {
      const next = await generatePromptVariations(result.positive_prompt, settings.maxPromptVariationsPerRequest, mode);
      setVariations(next);
      setStatus('Generated prompt variations.');
    } catch (variationError) {
      setError(variationError instanceof Error ? variationError.message : 'Variation generation failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const releaseMemory = async () => {
    const model = result.model_used || settings.ollamaSfwModel;
    if (performance.comfyuiBusy) {
      setStatus('ComfyUI is processing. AI memory will be released when possible.');
      return;
    }
    await unloadOllamaModel(model).catch(() => undefined);
    setStatus('AI memory release signal sent.');
  };

  const resultJson = useMemo(() => JSON.stringify(result, null, 2), [result]);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-[#0a0a0a] text-gray-900 dark:text-gray-100">
      <header className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 border-b border-black/5 dark:border-white/5 bg-white/80 dark:bg-[#0a0a0a]/80 px-6 py-4 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button onClick={onNavigateHome} className="text-sm font-bold text-violet-500 hover:text-violet-400">Back</button>
          <h1 className="text-xl font-black tracking-tight">Prompt Lab</h1>
        </div>
        <LocalAIStatus />
      </header>

      <main className="grid gap-5 px-4 py-5 lg:grid-cols-[320px_minmax(0,1fr)_320px]">
        <aside className="space-y-5">
          <section className="rounded-2xl border border-black/5 dark:border-white/10 bg-white/80 dark:bg-[#111]/80 p-4 shadow-xl shadow-black/5">
            <h2 className="mb-3 text-sm font-black uppercase tracking-widest text-gray-500">Image</h2>
            {image?.imageUrl ? (
              <div className="space-y-3">
                <div className="overflow-hidden rounded-xl bg-black/20">
                  <img src={image.thumbnailUrl || image.imageUrl} className="max-h-80 w-full object-contain" alt="Prompt Lab source" referrerPolicy="no-referrer" />
                </div>
                <div className="text-xs text-gray-500">{image.source || 'Unknown source'} {image.imageId ? `- ${image.imageId}` : ''}</div>
                <div className="flex gap-2">
                  <a href={image.imageUrl} target="_blank" rel="noreferrer" className={`${buttonClass} bg-white/5 text-gray-400 hover:text-white`}>Open original</a>
                  <button onClick={() => setPromptLabImage(null)} className={`${buttonClass} bg-white/5 text-gray-400 hover:text-white`}>Change</button>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-white/10 p-5 text-sm text-gray-500">Open any image and choose Open in Prompt Lab.</div>
            )}
          </section>

          <section className="rounded-2xl border border-black/5 dark:border-white/10 bg-white/80 dark:bg-[#111]/80 p-4 shadow-xl shadow-black/5">
            <h2 className="mb-3 text-sm font-black uppercase tracking-widest text-gray-500">Configuration</h2>
            <div className="space-y-3">
              <select className={selectClass} value={mode} onChange={event => setMode(event.target.value as PromptMode)}>
                <option value="sfw">SFW</option>
                <option value="nsfw">NSFW</option>
              </select>
              <select className={selectClass} value={targetCheckpoint} onChange={event => setTargetCheckpoint(event.target.value as TargetCheckpoint)}>
                {['generic', 'sdxl', 'illustrious', 'pony', 'flux', 'anime', 'realistic'].map(value => <option key={value} value={value}>{value}</option>)}
              </select>
              <label className="block space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Checkpoint Prompt Preset</span>
                <select className={selectClass} value={checkpointPreset} onChange={event => setCheckpointPreset(event.target.value as CheckpointType | 'auto')}>
                  <option value="auto">Auto</option>
                  {promptPresets.map(preset => (
                    <option key={preset.id} value={preset.id}>{preset.label}</option>
                  ))}
                </select>
              </label>
              <select className={selectClass} value={modelOverride} onChange={event => setModelOverride(event.target.value)}>
                <option value="auto">auto</option>
                <option value="gemma4:e4b">gemma4:e4b</option>
                <option value="qwen3-vl:4b">qwen3-vl:4b</option>
                <option value="dolphin3">dolphin3</option>
                <option value="dolphin-mistral">dolphin-mistral</option>
                <option value="custom">custom</option>
              </select>
              {modelOverride === 'custom' && <input className={selectClass} value={customModel} onChange={event => setCustomModel(event.target.value)} placeholder="model:tag" />}
              <textarea className={`${selectClass} min-h-24`} value={customInstruction} onChange={event => setCustomInstruction(event.target.value)} placeholder="Optional custom instruction" />
              {showVisionWarning && (
                <p className="rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-3 text-xs text-yellow-500">
                  {effectiveModel} may be text-only. Image analysis needs a vision model, otherwise the result can be generic or invented.
                </p>
              )}
              {performance.comfyuiBusy && <p className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-500">ComfyUI is processing. AI features will be available when it finishes.</p>}
              <button disabled={aiBlocked || isLoading || !image?.imageUrl} onClick={runAnalysis} className={`${buttonClass} w-full bg-violet-600 text-white hover:bg-violet-700`}>
                Generate prompt with AI
              </button>
            </div>
          </section>
        </aside>

        <section className="min-w-0 rounded-2xl border border-black/5 dark:border-white/10 bg-white/80 dark:bg-[#111]/80 p-4 shadow-xl shadow-black/5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-black uppercase tracking-widest text-gray-500">Structured Result</h2>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => copyText(result.positive_prompt)} className={`${buttonClass} bg-emerald-500/10 text-emerald-500`}>Copy positive</button>
              <button onClick={() => copyText(result.negative_prompt)} className={`${buttonClass} bg-red-500/10 text-red-500`}>Copy negative</button>
              <button onClick={() => copyText(result.booru_tags.join(', '))} className={`${buttonClass} bg-white/5 text-gray-400`}>Copy tags</button>
              <button onClick={() => copyText(resultJson)} className={`${buttonClass} bg-white/5 text-gray-400`}>Copy JSON</button>
            </div>
          </div>

          {(isLoading || status || error) && (
            <div className={`mb-4 rounded-xl border p-3 text-sm ${error ? 'border-red-500/20 bg-red-500/10 text-red-400' : 'border-violet-500/20 bg-violet-500/10 text-violet-300'}`}>
              {isLoading ? <div className="flex items-center gap-3"><Spinner /> <span>{status || 'Working...'}</span></div> : error || status}
            </div>
          )}

          {promptBuildResult && (
            <div className="mb-4 rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-3 text-xs text-cyan-300">
              <div className="font-bold">Preset used: {promptBuildResult.templateUsed}</div>
              <div className="mt-1 text-cyan-200/80">{promptBuildResult.notes}</div>
              {promptBuildResult.recommendedSettings && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {Object.entries(promptBuildResult.recommendedSettings).map(([key, value]) => (
                    <span key={key} className="rounded-full bg-black/20 px-2 py-1">{key}: {value}</span>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            {textFields.map(field => (
              <label key={field} className={field === 'positive_prompt' || field === 'negative_prompt' ? 'md:col-span-2' : ''}>
                <span className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-gray-500">{field.replace(/_/g, ' ')}</span>
                <textarea
                  value={String(result[field] || '')}
                  onChange={event => setResult(prev => ({ ...prev, [field]: event.target.value }))}
                  className={`${selectClass} ${field === 'positive_prompt' || field === 'negative_prompt' ? 'min-h-32' : 'min-h-20'}`}
                />
              </label>
            ))}
            <label className="md:col-span-2">
              <span className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-gray-500">booru tags</span>
              <input className={selectClass} value={result.booru_tags.join(', ')} onChange={event => setResult(prev => ({ ...prev, booru_tags: event.target.value.split(',').map(tag => tag.trim()).filter(Boolean) }))} />
            </label>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button onClick={saveHistory} className={`${buttonClass} bg-violet-600 text-white`}>Save to history</button>
            <button disabled={aiBlocked || !result.positive_prompt} onClick={generateVariations} className={`${buttonClass} bg-white/5 text-gray-400 hover:text-white`}>Generate variations</button>
            <button disabled={aiBlocked || !result.positive_prompt} onClick={refine} className={`${buttonClass} bg-white/5 text-gray-400 hover:text-white`}>Refine prompt</button>
            <button disabled={!result.description && !result.positive_prompt} onClick={() => rebuildForPreset(resolvedCheckpointPreset)} className={`${buttonClass} bg-cyan-500/10 text-cyan-500`}>Apply preset</button>
            <button disabled={!result.positive_prompt} onClick={sendToComfy} className={`${buttonClass} bg-emerald-600 text-white`}>Send to ComfyUI</button>
            <button onClick={() => sendToVaultChat({ analysis: result, image: image || undefined })} className={`${buttonClass} bg-cyan-500/10 text-cyan-500`}>Send to Vault Chat</button>
            <button onClick={releaseMemory} className={`${buttonClass} bg-white/5 text-gray-400 hover:text-white`}>Release AI memory</button>
          </div>

          {result.positive_prompt && (
            <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3">
              <h3 className="mb-2 text-xs font-black uppercase tracking-widest text-gray-500">Convert Current Prompt</h3>
              <div className="flex flex-wrap gap-2">
                {(['sdxl', 'pony', 'illustrious', 'animagine', 'flux', 'z_image', 'z_image_turbo', 'anime_generic', 'realistic_generic'] as CheckpointType[]).map(preset => (
                  <button key={preset} onClick={() => convertCurrentPrompt(preset)} className={`${buttonClass} bg-black/10 text-gray-500 hover:text-white`}>
                    {preset.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            </div>
          )}

          {variations.length > 0 && (
            <div className="mt-5 space-y-2 rounded-xl border border-white/10 bg-black/10 p-3">
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-500">Variations</h3>
              {variations.map((variation, index) => (
                <button key={`${variation}-${index}`} onClick={() => setResult(prev => ({ ...prev, positive_prompt: variation }))} className="block w-full rounded-lg bg-white/5 p-3 text-left text-xs text-gray-400 hover:text-white">
                  {variation}
                </button>
              ))}
            </div>
          )}
        </section>

        <aside className="rounded-2xl border border-black/5 dark:border-white/10 bg-white/80 dark:bg-[#111]/80 p-4 shadow-xl shadow-black/5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-sm font-black uppercase tracking-widest text-gray-500">Prompt History</h2>
            <span className="text-xs text-gray-500">{history.length}</span>
          </div>
          <input className={selectClass} value={historyQuery} onChange={event => setHistoryQuery(event.target.value)} placeholder="Search tags, model, mode..." />
          <div className="mt-4 max-h-[72vh] space-y-3 overflow-y-auto no-scrollbar">
            {history.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/10 p-4 text-sm text-gray-500">No saved prompts yet.</div>
            ) : history.map(item => (
              <div key={item.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="mb-2 flex items-center justify-between gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                  <span>{item.mode} - {item.modelUsed}</span>
                  <button onClick={() => { deletePromptHistoryItem(item.id); refreshHistory(); }} className="text-red-400">Delete</button>
                </div>
                <p className="line-clamp-3 text-xs text-gray-400">{item.positivePrompt}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button onClick={() => { setResult(item.fullAnalysisJson); setMode(item.mode); setTargetCheckpoint(item.targetCheckpoint); }} className={`${buttonClass} bg-violet-500/10 text-violet-400`}>Reopen</button>
                  <button onClick={() => copyText(item.positivePrompt)} className={`${buttonClass} bg-white/5 text-gray-400`}>Copy</button>
                  <button onClick={() => sendToVaultChat({ historyItem: item })} className={`${buttonClass} bg-cyan-500/10 text-cyan-500`}>Chat</button>
                  <button onClick={() => sendPromptToComfyUI({ positivePrompt: item.positivePrompt, negativePrompt: item.negativePrompt }).then(onNavigateComfyUI)} className={`${buttonClass} bg-emerald-500/10 text-emerald-500`}>ComfyUI</button>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </main>
    </div>
  );
};
