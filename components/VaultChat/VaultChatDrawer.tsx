import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { ChatMessage, ChatMode, ChatSession, CheckpointType } from '../../types/ai.types';
import { useAI } from '../AI/AIContext';
import { usePerformanceState } from '../AI/LocalAIStatus';
import {
  buildChatSystemPrompt,
  deleteChatSession,
  extractPromptFromAssistantResponse,
  loadChatSessions,
  saveChatSession,
  sendChatMessage,
} from '../../services/ollamaChatService';
import { getSettings } from '../../services/settingsService';
import { savePromptHistoryItem } from '../../services/promptHistoryService';
import { sendPromptToComfyUI } from '../../services/comfyuiService';
import { emptyPromptHistoryFromPrompt } from './vaultChatUtils';
import { convertPromptBetweenPresets, detectPresetFromCommand, formatPromptBuildResult } from '../../services/promptTemplateEngine';
import { getAllPromptTemplatePresets } from '../../services/promptTemplateRegistry';

interface VaultChatDrawerProps {
  onOpenPromptLab: (prompt?: string) => void;
  onOpenComfyUI: () => void;
}

const buttonClass = 'rounded-xl px-3 py-2 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-40';
const inputClass = 'rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#151515] px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-violet-500';

const makeMessage = (role: ChatMessage['role'], content: string, attachments: ChatMessage['attachments'] = []): ChatMessage => ({
  id: `msg-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  role,
  content,
  attachments,
  timestamp: new Date().toISOString(),
});

const makeSession = (mode: ChatMode, model: string): ChatSession => ({
  id: `chat-${Date.now()}`,
  title: 'New Vault Chat',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  mode,
  modelUsed: model,
  messages: [],
});

export const VaultChatDrawer: React.FC<VaultChatDrawerProps> = ({ onOpenPromptLab, onOpenComfyUI }) => {
  const settings = getSettings();
  const { vaultChatOpen, setVaultChatOpen, vaultChatContext } = useAI();
  const performance = usePerformanceState();
  const [mode, setMode] = useState<ChatMode>('sfw');
  const [model, setModel] = useState('auto');
  const [customModel, setCustomModel] = useState('');
  const [input, setInput] = useState('');
  const [session, setSession] = useState<ChatSession>(() => makeSession('sfw', 'auto'));
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [error, setError] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [conversionPreset, setConversionPreset] = useState<CheckpointType>('sdxl');
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const resolvedModel = model === 'custom' ? customModel : model;
  const blocked = performance.comfyuiBusy || performance.ollamaBusy || isSending;

  useEffect(() => {
    setSessions(loadChatSessions());
  }, [vaultChatOpen]);

  useEffect(() => {
    if (!vaultChatContext) return;
    const attachments: ChatMessage['attachments'] = [];
    if (vaultChatContext.analysis) attachments.push({ type: 'analysis', label: 'Prompt Lab analysis', data: JSON.stringify(vaultChatContext.analysis, null, 2) });
    if (vaultChatContext.historyItem) attachments.push({ type: 'history_item', label: 'Prompt history item', data: JSON.stringify(vaultChatContext.historyItem, null, 2) });
    if (vaultChatContext.image) attachments.push({ type: 'image', label: 'Selected image URL', data: vaultChatContext.image.imageUrl });
    if (vaultChatContext.text) attachments.push({ type: 'positive_prompt', label: 'Prompt text', data: vaultChatContext.text });
    if (attachments.length > 0) {
      setSession(prev => ({ ...prev, messages: [...prev.messages, makeMessage('user', 'Context attached for the next response.', attachments)] }));
    }
  }, [vaultChatContext]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session.messages, vaultChatOpen]);

  const latestPrompt = useMemo(() => {
    const assistantMessages = session.messages.filter(message => message.role === 'assistant').reverse();
    for (const message of assistantMessages) {
      const prompt = extractPromptFromAssistantResponse(message.content);
      if (prompt) return prompt;
    }
    return null;
  }, [session.messages]);
  const promptPresets = useMemo(() => getAllPromptTemplatePresets(), []);

  const persist = (next: ChatSession) => {
    const saved = { ...next, updatedAt: new Date().toISOString(), mode, modelUsed: resolvedModel };
    saveChatSession(saved);
    setSession(saved);
    setSessions(loadChatSessions());
  };

  const send = async () => {
    const content = input.trim();
    if (!content) return;
    setError('');
    setInput('');

    const commandPreset = detectPresetFromCommand(content);
    if (commandPreset && latestPrompt && /(convert|refine|make|turn|prompt|negative|tags)/i.test(content)) {
      const converted = convertPromptBetweenPresets({
        sourcePrompt: latestPrompt,
        sourcePreset: conversionPreset,
        targetPreset: commandPreset,
        mode: mode === 'nsfw' ? 'nsfw' : 'sfw',
        preserveSubject: true,
        preserveComposition: true,
        preserveStyle: true,
      });
      const userMessage = makeMessage('user', content);
      const assistantMessage = makeMessage('assistant', formatPromptBuildResult(converted));
      persist({ ...session, messages: [...session.messages, userMessage, assistantMessage], title: session.title === 'New Vault Chat' ? content.slice(0, 48) : session.title });
      return;
    }

    setIsSending(true);
    const userMessage = makeMessage('user', content);
    const nextSession = { ...session, messages: [...session.messages, userMessage] };
    setSession(nextSession);
    try {
      const response = await sendChatMessage(nextSession.messages, resolvedModel, buildChatSystemPrompt(mode));
      const assistantMessage = makeMessage('assistant', response);
      persist({ ...nextSession, messages: [...nextSession.messages, assistantMessage], title: nextSession.title === 'New Vault Chat' ? content.slice(0, 48) : nextSession.title });
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'Vault Chat failed.');
      setSession(session);
    } finally {
      setIsSending(false);
    }
  };

  if (!settings.vaultChatEnabled) return null;

  return (
    <>
      <button
        onClick={() => setVaultChatOpen(true)}
        className="fixed bottom-5 right-5 z-40 rounded-full border border-violet-400/30 bg-violet-600 px-5 py-3 text-sm font-black text-white shadow-2xl shadow-violet-900/40"
      >
        Vault Chat
      </button>

      {vaultChatOpen && (
        <div className="fixed inset-0 z-[120] flex justify-end bg-black/40 backdrop-blur-sm" onClick={() => setVaultChatOpen(false)}>
          <aside
            className="flex h-full w-full max-w-xl flex-col border-l border-white/10 bg-white dark:bg-[#0d0d0d] text-gray-900 dark:text-gray-100 shadow-2xl"
            onClick={event => event.stopPropagation()}
          >
            <header className="border-b border-black/5 dark:border-white/10 p-4">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black">Vault Chat</h2>
                  <p className="text-xs text-gray-500">{performance.comfyuiBusy ? 'ComfyUI is generating. Vault Chat will be available when processing finishes.' : 'AI available.'}</p>
                </div>
                <button onClick={() => setVaultChatOpen(false)} className="rounded-full bg-white/5 px-3 py-1 text-sm font-bold text-gray-500">Close</button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <select className={inputClass} value={mode} onChange={event => setMode(event.target.value as ChatMode)}>
                  <option value="sfw">SFW</option>
                  <option value="nsfw">NSFW</option>
                  <option value="prompt_engineering">Prompt Engineering</option>
                  <option value="comfyui_helper">ComfyUI Helper</option>
                  <option value="dev">Dev</option>
                  <option value="free">Free</option>
                </select>
                <select className={inputClass} value={model} onChange={event => setModel(event.target.value)}>
                  <option value="auto">auto</option>
                  <option value="gemma4:e4b">gemma4:e4b</option>
                  <option value="qwen3-vl:4b">qwen3-vl:4b</option>
                  <option value="dolphin3">dolphin3</option>
                  <option value="dolphin-mistral">dolphin-mistral</option>
                  <option value="custom">custom</option>
                </select>
                {model === 'custom' && <input className={`${inputClass} col-span-2`} value={customModel} onChange={event => setCustomModel(event.target.value)} placeholder="model:tag" />}
                <select className={`${inputClass} col-span-2`} value={conversionPreset} onChange={event => setConversionPreset(event.target.value as CheckpointType)}>
                  {promptPresets.filter(preset => preset.id !== 'custom').map(preset => (
                    <option key={preset.id} value={preset.id}>{preset.label}</option>
                  ))}
                </select>
              </div>
            </header>

            <div className="grid min-h-0 flex-1 grid-cols-[150px_minmax(0,1fr)]">
              <nav className="overflow-y-auto border-r border-black/5 dark:border-white/10 p-2">
                <button onClick={() => setSession(makeSession(mode, resolvedModel))} className={`${buttonClass} mb-2 w-full bg-violet-600 text-white`}>New chat</button>
                {sessions.map(item => (
                  <div key={item.id} className="mb-2 rounded-xl bg-white/5 p-2">
                    <button onClick={() => setSession(item)} className="block w-full truncate text-left text-xs font-bold text-gray-400 hover:text-white">{item.title}</button>
                    <button onClick={() => { deleteChatSession(item.id); setSessions(loadChatSessions()); }} className="mt-1 text-[10px] font-bold text-red-400">Delete</button>
                  </div>
                ))}
              </nav>

              <div className="flex min-w-0 flex-col">
                <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
                  {session.messages.length === 0 && (
                    <div className="rounded-xl border border-dashed border-white/10 p-5 text-sm text-gray-500">Ask for prompt refinement, ComfyUI help, tags, variations, or workflow debugging.</div>
                  )}
                  {session.messages.map(message => (
                    <div key={message.id} className={`rounded-2xl p-3 text-sm ${message.role === 'user' ? 'ml-8 bg-violet-600 text-white' : 'mr-8 bg-neutral-100 dark:bg-white/5 text-gray-700 dark:text-gray-200'}`}>
                      <p className="whitespace-pre-wrap">{message.content}</p>
                      {message.attachments && message.attachments.length > 0 && (
                        <div className="mt-2 space-y-1 border-t border-white/10 pt-2 text-[10px] opacity-80">
                          {message.attachments.map(attachment => <div key={`${message.id}-${attachment.label}`}>{attachment.label}</div>)}
                        </div>
                      )}
                      {message.role === 'assistant' && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button onClick={() => navigator.clipboard?.writeText(message.content)} className={`${buttonClass} bg-white/10 text-current`}>Copy</button>
                          {extractPromptFromAssistantResponse(message.content) && (
                            <>
                              <button onClick={() => onOpenPromptLab(extractPromptFromAssistantResponse(message.content) || undefined)} className={`${buttonClass} bg-violet-500/20 text-current`}>Use in Prompt Lab</button>
                              <button onClick={() => sendPromptToComfyUI({ positivePrompt: extractPromptFromAssistantResponse(message.content) || '', negativePrompt: '' }).then(onOpenComfyUI)} className={`${buttonClass} bg-emerald-500/20 text-current`}>ComfyUI</button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  <div ref={bottomRef} />
                </div>

                {error && <div className="mx-4 mb-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400">{error}</div>}
                {latestPrompt && (
                  <div className="mx-4 mb-2 flex flex-wrap gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-2">
                    <button onClick={() => navigator.clipboard?.writeText(latestPrompt)} className={`${buttonClass} bg-white/10 text-emerald-500`}>Copy prompt</button>
                    <button
                      onClick={() => {
                        const converted = convertPromptBetweenPresets({
                          sourcePrompt: latestPrompt,
                          sourcePreset: conversionPreset,
                          targetPreset: conversionPreset,
                          mode: mode === 'nsfw' ? 'nsfw' : 'sfw',
                          preserveSubject: true,
                          preserveComposition: true,
                          preserveStyle: true,
                        });
                        const assistantMessage = makeMessage('assistant', formatPromptBuildResult(converted));
                        persist({ ...session, messages: [...session.messages, assistantMessage] });
                      }}
                      className={`${buttonClass} bg-white/10 text-emerald-500`}
                    >
                      Convert preset
                    </button>
                    <button onClick={() => savePromptHistoryItem(emptyPromptHistoryFromPrompt(latestPrompt, mode, resolvedModel))} className={`${buttonClass} bg-white/10 text-emerald-500`}>Save to history</button>
                    <button onClick={() => sendPromptToComfyUI({ positivePrompt: latestPrompt, negativePrompt: '' }).then(onOpenComfyUI)} className={`${buttonClass} bg-white/10 text-emerald-500`}>Send to ComfyUI</button>
                  </div>
                )}
                <div className="border-t border-black/5 dark:border-white/10 p-4">
                  <div className="flex gap-2">
                    <textarea
                      value={input}
                      onChange={event => setInput(event.target.value)}
                      onKeyDown={event => {
                        if (event.key === 'Enter' && !event.shiftKey) {
                          event.preventDefault();
                          send();
                        }
                      }}
                      disabled={blocked}
                      className={`${inputClass} min-h-14 flex-1 resize-none`}
                      placeholder={blocked ? 'Local AI is busy...' : 'Message Vault Chat...'}
                    />
                    <button disabled={blocked || !input.trim()} onClick={send} className={`${buttonClass} bg-violet-600 text-white`}>{isSending ? '...' : 'Send'}</button>
                  </div>
                  <button onClick={() => persist({ ...session, messages: [] })} className="mt-2 text-xs font-bold text-gray-500 hover:text-gray-300">Clear conversation</button>
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}
    </>
  );
};
