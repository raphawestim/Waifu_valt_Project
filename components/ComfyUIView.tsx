import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { WaifuImage } from '../types';
import type { ComfyUIPromptPayload, ComfyUIStatus } from '../types/ai.types';
import { Spinner } from './Spinner';
import { useTheme } from '../context/ThemeContext';
import { getComfyUIStatus } from '../services/comfyuiService';
import { getSettings } from '../services/settingsService';
import { LocalAIStatus } from './AI/LocalAIStatus';

interface ComfyUIImage {
  filename: string;
  folder: string;
  size: number;
  modified: number;
  url: string;
  positivePrompt?: string;
  negativePrompt?: string;
}

interface ComfyUIViewProps {
  onImageClick: (image: WaifuImage, collection: WaifuImage[]) => void;
  onNavigateHome: () => void;
}

type TabType = 'workflow' | 'gallery';

const comfyToWaifu = (img: ComfyUIImage): WaifuImage => ({
  id: `comfyui-${img.folder}-${img.filename}`,
  thumbnailUrl: img.url,
  fullUrl: img.url,
  tags: [img.folder, img.filename.replace(/\.[^.]+$/, '')],
  score: 0,
  artist: 'ComfyUI / Local',
  sourceApi: 'comfyui',
  rating: 'safe',
  width: 0,
  height: 0,
  type: 'image',
  positivePrompt: img.positivePrompt,
  negativePrompt: img.negativePrompt,
});

export const ComfyUIView: React.FC<ComfyUIViewProps> = ({ onImageClick, onNavigateHome }) => {
  const { theme, toggleTheme } = useTheme();
  const settings = getSettings();
  const [activeTab, setActiveTab] = useState<TabType>('workflow');
  const [status, setStatus] = useState<ComfyUIStatus | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [startMessage, setStartMessage] = useState('');
  const [iframeFailed, setIframeFailed] = useState(false);
  const [preparedPrompt, setPreparedPrompt] = useState<ComfyUIPromptPayload | null>(null);
  const [folders, setFolders] = useState<string[]>([]);
  const [activeFolder, setActiveFolder] = useState('');
  const [images, setImages] = useState<ComfyUIImage[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(false);

  const checkStatus = useCallback(async () => {
    const next = await getComfyUIStatus();
    setStatus(next);
    if (next.online) {
      setIsStarting(false);
      setStartMessage('');
    }
  }, []);

  useEffect(() => {
    checkStatus();
    const timer = window.setInterval(checkStatus, settings.comfyuiPollingActivMs);
    return () => window.clearInterval(timer);
  }, [checkStatus, settings.comfyuiPollingActivMs]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('wv_comfyui_prepared_prompt');
      setPreparedPrompt(raw ? JSON.parse(raw) as ComfyUIPromptPayload : null);
    } catch {
      setPreparedPrompt(null);
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== 'gallery') return;
    setGalleryLoading(true);
    fetch('/api/comfyui/folders')
      .then(response => response.json())
      .then((data: string[]) => {
        setFolders(data);
        if (data.length > 0 && !activeFolder) setActiveFolder(data[0]);
      })
      .catch(() => undefined)
      .finally(() => setGalleryLoading(false));
  }, [activeFolder, activeTab]);

  useEffect(() => {
    if (!activeFolder || activeTab !== 'gallery') return;
    setGalleryLoading(true);
    fetch(`/api/comfyui/images?folder=${encodeURIComponent(activeFolder)}`)
      .then(response => response.json())
      .then((data: ComfyUIImage[]) => setImages(data))
      .catch(() => setImages([]))
      .finally(() => setGalleryLoading(false));
  }, [activeFolder, activeTab]);

  const waifuImages = useMemo(() => images.map(comfyToWaifu), [images]);

  const handleStart = async () => {
    setIsStarting(true);
    setStartMessage('Launching ComfyUI. This may take a minute.');
    try {
      const response = await fetch('/api/comfyui/start', { method: 'POST' });
      const data = await response.json() as { message?: string; status?: string };
      setStartMessage(data.message || 'Starting ComfyUI...');
      if (data.status === 'already_running') await checkStatus();
    } catch {
      setStartMessage('Failed to start ComfyUI. You can still open it externally.');
      setIsStarting(false);
    }
  };

  const online = Boolean(status?.online);
  const processing = Boolean(status?.busy);

  return (
    <div className="flex min-h-screen w-full flex-col bg-neutral-50 text-gray-900 transition-colors duration-300 dark:bg-[#0a0a0a] dark:text-gray-100">
      <nav className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 border-b border-black/5 bg-white/80 px-4 py-3 backdrop-blur-md dark:border-white/5 dark:bg-[#0a0a0a]/80 sm:px-6">
        <div className="flex items-center gap-3">
          <button onClick={onNavigateHome} className="text-sm font-black tracking-tight hover:opacity-75">
            WAIFU<span className="text-violet-500">VAULT</span>
          </button>
          <span className="hidden text-gray-500 sm:block">/</span>
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${processing ? 'bg-amber-500' : online ? 'bg-emerald-500' : 'bg-red-500'}`} />
            <h1 className="text-sm font-bold sm:text-lg">ComfyUI Studio</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setActiveTab('workflow')} className={`rounded-xl px-4 py-2 text-xs font-bold ${activeTab === 'workflow' ? 'bg-violet-600 text-white' : 'bg-white dark:bg-[#151515] text-gray-500'}`}>Workflow</button>
          <button onClick={() => setActiveTab('gallery')} className={`rounded-xl px-4 py-2 text-xs font-bold ${activeTab === 'gallery' ? 'bg-violet-600 text-white' : 'bg-white dark:bg-[#151515] text-gray-500'}`}>Gallery</button>
        </div>

        <div className="flex items-center gap-2">
          <LocalAIStatus compact />
          <button onClick={checkStatus} className="rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-bold text-gray-600 dark:border-white/10 dark:bg-[#151515] dark:text-gray-300">Reload</button>
          <a href={settings.comfyuiUrl} target="_blank" rel="noreferrer" className="rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-bold text-gray-600 dark:border-white/10 dark:bg-[#151515] dark:text-gray-300">Open externally</a>
          <button onClick={toggleTheme} className="rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-bold text-gray-600 dark:border-white/10 dark:bg-[#151515] dark:text-gray-300">
            {theme === 'dark' ? 'Light' : 'Dark'}
          </button>
        </div>
      </nav>

      {activeTab === 'workflow' ? (
        online ? (
          <div className="grid min-h-0 flex-1 grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="relative min-h-[76vh]">
              {iframeFailed && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#0a0a0a] p-6 text-center">
                  <div className="max-w-md rounded-2xl border border-white/10 bg-white/5 p-5">
                    <h2 className="text-lg font-black text-white">ComfyUI blocked the internal frame</h2>
                    <p className="mt-2 text-sm text-gray-400">X-Frame-Options or CSP may prevent embedding. The external fallback remains available.</p>
                    <a href={settings.comfyuiUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex rounded-xl bg-violet-600 px-4 py-2 text-sm font-bold text-white">Open externally</a>
                  </div>
                </div>
              )}
              <iframe
                src={settings.comfyuiUrl}
                className="h-full min-h-[76vh] w-full border-none"
                title="ComfyUI Workflow"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
                onError={() => setIframeFailed(true)}
              />
            </div>
            <aside className="border-t border-black/5 bg-white p-4 dark:border-white/10 dark:bg-[#101010] xl:border-l xl:border-t-0">
              <h2 className="mb-3 text-xs font-black uppercase tracking-widest text-gray-500">Prepared Prompt</h2>
              {preparedPrompt ? (
                <div className="space-y-3">
                  <textarea readOnly value={preparedPrompt.positivePrompt} className="min-h-44 w-full rounded-xl border border-black/10 bg-neutral-50 p-3 text-xs text-gray-600 outline-none dark:border-white/10 dark:bg-white/5 dark:text-gray-400" />
                  <textarea readOnly value={preparedPrompt.negativePrompt} className="min-h-24 w-full rounded-xl border border-black/10 bg-neutral-50 p-3 text-xs text-gray-600 outline-none dark:border-white/10 dark:bg-white/5 dark:text-gray-400" />
                  <button onClick={() => navigator.clipboard?.writeText(preparedPrompt.positivePrompt)} className="w-full rounded-xl bg-violet-600 px-3 py-2 text-xs font-bold text-white">Copy positive prompt</button>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-black/10 p-4 text-sm text-gray-500 dark:border-white/10">Send a prompt from Prompt Lab or Vault Chat to stage it here.</div>
              )}
              <div className="mt-4 rounded-xl border border-black/10 bg-neutral-50 p-3 text-xs text-gray-500 dark:border-white/10 dark:bg-white/5">
                Queue: {status?.queueRunning || 0} running, {status?.queuePending || 0} pending
              </div>
            </aside>
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center px-4">
            <div className="max-w-md text-center">
              <h2 className="text-3xl font-black tracking-tight">ComfyUI is not running</h2>
              <p className="mt-3 text-sm text-gray-500">Start the local server to use the internal tab.</p>
              {isStarting ? (
                <div className="mt-6 space-y-3">
                  <Spinner label="Starting ComfyUI..." />
                  <p className="text-xs text-gray-500">{startMessage}</p>
                </div>
              ) : (
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <button onClick={handleStart} className="rounded-2xl bg-violet-600 px-6 py-3 text-sm font-bold text-white">Start ComfyUI</button>
                  <button onClick={checkStatus} className="rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-bold text-gray-500">Try again</button>
                  <a href={settings.comfyuiUrl} target="_blank" rel="noreferrer" className="rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-bold text-gray-500">Open externally</a>
                </div>
              )}
            </div>
          </div>
        )
      ) : (
        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-3xl font-black tracking-tight">My Generations</h2>
              <p className="mt-1 text-sm text-gray-500">Browse locally generated ComfyUI artworks.</p>
            </div>
          </div>

          <div className="mb-6 flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {folders.map(folder => (
              <button key={folder} onClick={() => setActiveFolder(folder)} className={`whitespace-nowrap rounded-xl px-4 py-2 text-xs font-bold ${activeFolder === folder ? 'bg-violet-600 text-white' : 'bg-white text-gray-500 dark:bg-[#151515]'}`}>{folder}</button>
            ))}
          </div>

          {galleryLoading ? (
            <div className="flex h-[50vh] items-center justify-center"><Spinner label="Loading generations..." /></div>
          ) : images.length === 0 ? (
            <div className="flex h-[50vh] items-center justify-center rounded-2xl border border-dashed border-white/10 text-gray-500">No images found.</div>
          ) : (
            <div className="columns-2 gap-3 space-y-3 sm:columns-3 md:columns-4 lg:columns-5">
              {images.map(img => (
                <button
                  key={`${img.folder}-${img.filename}`}
                  onClick={() => onImageClick(comfyToWaifu(img), waifuImages)}
                  className="group relative block w-full break-inside-avoid overflow-hidden rounded-xl border border-black/5 bg-neutral-200 text-left shadow-md transition hover:ring-2 hover:ring-violet-500/50 dark:border-white/5 dark:bg-white/5"
                >
                  <img src={img.url} alt={img.filename} className="h-auto w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" loading="lazy" />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 text-white opacity-0 transition-opacity group-hover:opacity-100">
                    <p className="truncate text-xs font-bold">{img.filename}</p>
                    <p className="text-[10px] text-white/60">{(img.size / 1024 / 1024).toFixed(1)} MB</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
