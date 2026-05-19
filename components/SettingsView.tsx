import React, { useEffect, useState } from 'react';
import type { AppAISettings, PromptStyle, PromptTemplatePreset } from '../types/ai.types';
import { DEFAULT_SETTINGS, getSettings, resetSettings, updateSettings } from '../services/settingsService';
import { unloadOllamaModel } from '../services/ollamaService';
import { LocalAIStatus } from './AI/LocalAIStatus';
import localAIExecutionManager from '../services/LocalAIExecutionManager';
import { deleteCustomPromptTemplatePreset, getCustomPromptTemplatePresets, saveCustomPromptTemplatePreset } from '../services/promptTemplateRegistry';

interface SettingsViewProps {
  onNavigateHome: () => void;
}

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <label className="block space-y-2">
    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{label}</span>
    {children}
  </label>
);

const inputClass = 'w-full rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#151515] px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-violet-500';

export const SettingsView: React.FC<SettingsViewProps> = ({ onNavigateHome }) => {
  const [settings, setSettings] = useState<AppAISettings>(getSettings());
  const [message, setMessage] = useState('');
  const [customPresets, setCustomPresets] = useState<PromptTemplatePreset[]>(getCustomPromptTemplatePresets());
  const [customPresetName, setCustomPresetName] = useState('');
  const [customPromptStyle, setCustomPromptStyle] = useState<PromptStyle>('hybrid');
  const [customPositivePrefix, setCustomPositivePrefix] = useState('');
  const [customNegativePrompt, setCustomNegativePrompt] = useState('');
  const [customSupportsNegative, setCustomSupportsNegative] = useState(true);

  useEffect(() => setSettings(getSettings()), []);

  const patch = (updates: Partial<AppAISettings>) => {
    const next = updateSettings(updates);
    setSettings(next);
    setMessage('Settings saved.');
  };

  const releaseMemory = async () => {
    const state = localAIExecutionManager.getPerformanceState();
    if (state.comfyuiBusy) {
      setMessage('ComfyUI is processing. AI memory will be released when possible.');
      return;
    }
    const models = [settings.ollamaSfwModel, settings.ollamaNsfwModel, settings.ollamaFallbackModel].filter(Boolean);
    await Promise.all(models.map(model => unloadOllamaModel(model).catch(() => undefined)));
    setMessage('AI memory release signal sent to Ollama.');
  };

  const saveCustomPreset = () => {
    const label = customPresetName.trim();
    if (!label) {
      setMessage('Give the custom preset a name first.');
      return;
    }

    const prefix = customPositivePrefix.split(',').map(item => item.trim()).filter(Boolean);
    const preset: PromptTemplatePreset = {
      id: `custom_${label.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`,
      label,
      description: `Custom prompt preset: ${label}`,
      promptStyle: customPromptStyle,
      supportsNegativePrompt: customSupportsNegative,
      prefersNegativePrompt: customSupportsNegative,
      supportsWeights: true,
      recommendedPositiveStructure: ['custom prefix', 'subject', 'composition', 'style', 'quality'],
      recommendedNegativeStructure: customSupportsNegative ? ['custom negative prompt'] : [],
      qualityPrefix: prefix,
      ratingTags: [],
      sourceTags: [],
      styleTags: [],
      defaultNegativePrompt: customSupportsNegative ? customNegativePrompt : '',
      promptBuilderRules: [`Use ${customPromptStyle.replace(/_/g, ' ')} style.`, 'Apply the custom positive prefix before generated content.'],
      examplePositivePrompt: [...prefix, 'subject, composition, style'].filter(Boolean).join(', '),
      exampleNegativePrompt: customSupportsNegative ? customNegativePrompt : '',
      recommendedSettings: {},
    };

    saveCustomPromptTemplatePreset(preset);
    setCustomPresets(getCustomPromptTemplatePresets());
    setMessage('Custom prompt preset saved. Reopen Prompt Lab to see it in the preset selector.');
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-[#0a0a0a] text-gray-900 dark:text-gray-100">
      <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-black/5 dark:border-white/5 bg-white/80 dark:bg-[#0a0a0a]/80 px-6 py-4 backdrop-blur-md">
        <button onClick={onNavigateHome} className="text-sm font-bold text-violet-500 hover:text-violet-400">Back to Vault</button>
        <LocalAIStatus />
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight">AI Settings</h1>
            <p className="mt-2 text-sm text-gray-500">Local Ollama, ComfyUI, memory, and Vault Chat configuration.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={releaseMemory} className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm font-bold text-cyan-500 hover:bg-cyan-500/20">
              Release AI memory
            </button>
            <button
              onClick={() => {
                const next = resetSettings();
                setSettings(next);
                setMessage('Settings reset to defaults.');
              }}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-200"
            >
              Reset
            </button>
          </div>
        </div>

        {message && <div className="mb-6 rounded-xl border border-violet-500/20 bg-violet-500/10 px-4 py-3 text-sm text-violet-300">{message}</div>}

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-black/5 dark:border-white/10 bg-white/80 dark:bg-[#111]/80 p-5 shadow-xl shadow-black/5">
            <h2 className="mb-5 text-lg font-black">Ollama</h2>
            <div className="space-y-4">
              <Field label="Base URL"><input className={inputClass} value={settings.ollamaBaseUrl} onChange={event => patch({ ollamaBaseUrl: event.target.value })} /></Field>
              <Field label="SFW model"><input className={inputClass} value={settings.ollamaSfwModel} onChange={event => patch({ ollamaSfwModel: event.target.value })} /></Field>
              <Field label="NSFW model"><input className={inputClass} value={settings.ollamaNsfwModel} onChange={event => patch({ ollamaNsfwModel: event.target.value })} /></Field>
              <Field label="Fallback model"><input className={inputClass} value={settings.ollamaFallbackModel} onChange={event => patch({ ollamaFallbackModel: event.target.value })} /></Field>
              <Field label="Default chat model"><input className={inputClass} value={settings.ollamaDefaultChatModel} onChange={event => patch({ ollamaDefaultChatModel: event.target.value })} /></Field>
            </div>
          </section>

          <section className="rounded-2xl border border-black/5 dark:border-white/10 bg-white/80 dark:bg-[#111]/80 p-5 shadow-xl shadow-black/5">
            <h2 className="mb-5 text-lg font-black">ComfyUI</h2>
            <div className="space-y-4">
              <Field label="ComfyUI URL"><input className={inputClass} value={settings.comfyuiUrl} onChange={event => patch({ comfyuiUrl: event.target.value })} /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Active polling ms"><input type="number" className={inputClass} value={settings.comfyuiPollingActivMs} onChange={event => patch({ comfyuiPollingActivMs: Number(event.target.value) })} /></Field>
                <Field label="Idle polling ms"><input type="number" className={inputClass} value={settings.comfyuiPollingIdleMs} onChange={event => patch({ comfyuiPollingIdleMs: Number(event.target.value) })} /></Field>
              </div>
              <label className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3 text-sm font-bold">
                ComfyUI priority mode
                <input type="checkbox" checked={settings.comfyuiPriorityMode} onChange={event => patch({ comfyuiPriorityMode: event.target.checked })} />
              </label>
              <label className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3 text-sm font-bold">
                Block Ollama while ComfyUI is busy
                <input type="checkbox" checked={settings.blockOllamaWhenComfyuiBusy} onChange={event => patch({ blockOllamaWhenComfyuiBusy: event.target.checked })} />
              </label>
            </div>
          </section>

          <section className="rounded-2xl border border-black/5 dark:border-white/10 bg-white/80 dark:bg-[#111]/80 p-5 shadow-xl shadow-black/5">
            <h2 className="mb-5 text-lg font-black">Defaults</h2>
            <div className="space-y-4">
              <Field label="Default mode">
                <select className={inputClass} value={settings.defaultMode} onChange={event => patch({ defaultMode: event.target.value as AppAISettings['defaultMode'] })}>
                  <option value="sfw">SFW</option>
                  <option value="nsfw">NSFW</option>
                </select>
              </Field>
              <Field label="Target checkpoint">
                <select className={inputClass} value={settings.defaultTargetCheckpoint} onChange={event => patch({ defaultTargetCheckpoint: event.target.value as AppAISettings['defaultTargetCheckpoint'] })}>
                  {['generic', 'sdxl', 'illustrious', 'pony', 'flux', 'anime', 'realistic'].map(value => <option key={value} value={value}>{value}</option>)}
                </select>
              </Field>
              <Field label="Max prompt variations"><input type="number" min={1} max={10} className={inputClass} value={settings.maxPromptVariationsPerRequest} onChange={event => patch({ maxPromptVariationsPerRequest: Number(event.target.value) })} /></Field>
            </div>
          </section>

          <section className="rounded-2xl border border-black/5 dark:border-white/10 bg-white/80 dark:bg-[#111]/80 p-5 shadow-xl shadow-black/5">
            <h2 className="mb-5 text-lg font-black">Memory</h2>
            <div className="space-y-4">
              <label className="flex items-center justify-between rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-3 text-sm font-bold text-cyan-500">
                Low Memory Mode
                <input type="checkbox" checked={settings.lowMemoryMode} onChange={event => patch({ lowMemoryMode: event.target.checked })} />
              </label>
              <Field label="Prompt Lab keep_alive"><input className={inputClass} value={settings.keepAlivePromptLab} disabled={settings.lowMemoryMode} onChange={event => patch({ keepAlivePromptLab: event.target.value })} /></Field>
              <Field label="Chat keep_alive"><input className={inputClass} value={settings.keepAliveChat} disabled={settings.lowMemoryMode} onChange={event => patch({ keepAliveChat: event.target.value })} /></Field>
              <Field label="Max chat messages in memory"><input type="number" className={inputClass} value={settings.maxChatHistoryInMemory} onChange={event => patch({ maxChatHistoryInMemory: Number(event.target.value) })} /></Field>
              <label className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3 text-sm font-bold">
                Auto unload after request
                <input type="checkbox" checked={settings.autoUnloadAfterRequest} onChange={event => patch({ autoUnloadAfterRequest: event.target.checked })} />
              </label>
            </div>
          </section>

          <section className="rounded-2xl border border-black/5 dark:border-white/10 bg-white/80 dark:bg-[#111]/80 p-5 shadow-xl shadow-black/5 lg:col-span-2">
            <h2 className="mb-5 text-lg font-black">Custom Checkpoint Presets</h2>
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-4">
                <Field label="Preset name"><input className={inputClass} value={customPresetName} onChange={event => setCustomPresetName(event.target.value)} placeholder="My SDXL Anime Mix" /></Field>
                <Field label="Prompt style">
                  <select className={inputClass} value={customPromptStyle} onChange={event => setCustomPromptStyle(event.target.value as PromptStyle)}>
                    <option value="natural_language">natural_language</option>
                    <option value="booru_tags">booru_tags</option>
                    <option value="hybrid">hybrid</option>
                    <option value="structured_caption">structured_caption</option>
                  </select>
                </Field>
                <Field label="Positive prefix tags"><input className={inputClass} value={customPositivePrefix} onChange={event => setCustomPositivePrefix(event.target.value)} placeholder="masterpiece, best quality, anime style" /></Field>
                <Field label="Default negative prompt"><textarea className={`${inputClass} min-h-20`} value={customNegativePrompt} onChange={event => setCustomNegativePrompt(event.target.value)} placeholder="low quality, blurry, watermark, text" /></Field>
                <label className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3 text-sm font-bold">
                  Supports negative prompt
                  <input type="checkbox" checked={customSupportsNegative} onChange={event => setCustomSupportsNegative(event.target.checked)} />
                </label>
                <button onClick={saveCustomPreset} className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-bold text-white hover:bg-violet-700">Save custom preset</button>
              </div>
              <div className="space-y-3">
                {customPresets.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-white/10 p-4 text-sm text-gray-500">No custom presets yet.</div>
                ) : customPresets.map(preset => (
                  <div key={preset.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-bold">{preset.label}</div>
                        <div className="text-xs text-gray-500">{preset.promptStyle} - {preset.supportsNegativePrompt ? 'negative enabled' : 'no negative'}</div>
                      </div>
                      <button
                        onClick={() => {
                          deleteCustomPromptTemplatePreset(preset.id);
                          setCustomPresets(getCustomPromptTemplatePresets());
                          setMessage('Custom preset deleted.');
                        }}
                        className="rounded-lg bg-red-500/10 px-3 py-1 text-xs font-bold text-red-400"
                      >
                        Delete
                      </button>
                    </div>
                    <div className="mt-2 line-clamp-2 text-xs text-gray-500">{preset.examplePositivePrompt}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4 text-xs text-gray-500">
          Defaults are kept in sync with the requested low-memory profile. Baseline: {DEFAULT_SETTINGS.ollamaSfwModel}, {DEFAULT_SETTINGS.ollamaNsfwModel}, fallback {DEFAULT_SETTINGS.ollamaFallbackModel}.
        </div>
      </main>
    </div>
  );
};
