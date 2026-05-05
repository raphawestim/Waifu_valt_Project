import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Spinner } from './Spinner';
import type { WaifuImage } from '../types';

interface ComfyUIImage {
    filename: string;
    folder: string;
    size: number;
    modified: number;
    url: string;
}

interface ComfyUIViewProps {
    onImageClick: (image: WaifuImage, collection: WaifuImage[]) => void;
    onNavigateHome: () => void;
}

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
    positivePrompt: (img as any).positivePrompt,
    negativePrompt: (img as any).negativePrompt,
});

type TabType = 'workflow' | 'gallery';

export const ComfyUIView: React.FC<ComfyUIViewProps> = ({ onImageClick, onNavigateHome }) => {
    const { theme, toggleTheme } = useTheme();
    const [activeTab, setActiveTab] = useState<TabType>('workflow');
    
    // ComfyUI status
    const [comfyStatus, setComfyStatus] = useState<'checking' | 'running' | 'stopped' | 'starting'>('checking');
    const [startMessage, setStartMessage] = useState('');
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
    
    // Gallery state
    const [folders, setFolders] = useState<string[]>([]);
    const [activeFolder, setActiveFolder] = useState<string>('');
    const [images, setImages] = useState<ComfyUIImage[]>([]);
    const [galleryLoading, setGalleryLoading] = useState(false);

    // Check ComfyUI status
    const checkStatus = useCallback(async () => {
        try {
            const resp = await fetch('/api/comfyui/status');
            const data = await resp.json();
            if (data.running) {
                setComfyStatus('running');
                setStartMessage('');
            } else if (comfyStatus === 'starting') {
                // Keep as 'starting' while we wait
            } else {
                setComfyStatus('stopped');
            }
        } catch {
            if (comfyStatus !== 'starting') setComfyStatus('stopped');
        }
    }, [comfyStatus]);

    // Poll status every 3 seconds
    useEffect(() => {
        checkStatus();
        pollRef.current = setInterval(checkStatus, 3000);
        return () => { if (pollRef.current) clearInterval(pollRef.current); };
    }, [checkStatus]);

    // Start ComfyUI
    const handleStart = async () => {
        setComfyStatus('starting');
        setStartMessage('Launching ComfyUI... Please wait, this may take a minute.');
        try {
            const resp = await fetch('/api/comfyui/start', { method: 'POST' });
            const data = await resp.json();
            if (data.status === 'already_running') {
                setComfyStatus('running');
                setStartMessage('');
            } else {
                setStartMessage(data.message || 'Starting...');
            }
        } catch (err) {
            setStartMessage('Failed to start ComfyUI. Check the console.');
            setComfyStatus('stopped');
        }
    };

    // Load gallery folders
    useEffect(() => {
        if (activeTab === 'gallery') {
            setGalleryLoading(true);
            fetch('/api/comfyui/folders')
                .then(r => r.json())
                .then((data: string[]) => {
                    setFolders(data);
                    if (data.length > 0 && !activeFolder) setActiveFolder(data[0]);
                    setGalleryLoading(false);
                })
                .catch(() => setGalleryLoading(false));
        }
    }, [activeTab]);

    // Load gallery images
    useEffect(() => {
        if (!activeFolder || activeTab !== 'gallery') return;
        setGalleryLoading(true);
        fetch(`/api/comfyui/images?folder=${encodeURIComponent(activeFolder)}`)
            .then(r => r.json())
            .then((data: ComfyUIImage[]) => {
                setImages(data);
                setGalleryLoading(false);
            })
            .catch(() => setGalleryLoading(false));
    }, [activeFolder, activeTab]);

    const waifuImages = images.map(comfyToWaifu);

    return (
        <div className="w-full min-h-screen flex flex-col bg-neutral-50 dark:bg-[#0a0a0a] transition-colors duration-300">
            {/* Top Navigation Bar */}
            <nav className="sticky top-0 z-30 px-4 sm:px-6 py-3 sm:py-4 flex flex-wrap justify-between items-center gap-3 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-md border-b border-black/5 dark:border-white/5">
                <div className="flex items-center gap-3 sm:gap-4">
                    <button
                        onClick={onNavigateHome}
                        className="flex items-center gap-2 hover:opacity-75 transition-opacity focus:outline-none"
                        title="Back to Home"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="sm:w-7 sm:h-7">
                            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M2 12L12 17L22 12" stroke="#8b5cf6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <h1 className="text-base sm:text-xl font-black tracking-tight text-gray-900 dark:text-white">
                            WAIFU<span className="text-violet-600 dark:text-violet-500">VAULT</span>
                        </h1>
                    </button>
                    <span className="text-gray-300 dark:text-gray-600 text-xl font-thin hidden sm:block">/</span>
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${comfyStatus === 'running' ? 'bg-emerald-500 animate-pulse' : comfyStatus === 'starting' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'}`} />
                        <h2 className="text-sm sm:text-lg font-bold text-gray-700 dark:text-gray-200">ComfyUI Studio</h2>
                    </div>
                </div>

                {/* Tab Switcher */}
                <div className="flex items-center gap-1 bg-white dark:bg-[#151515] rounded-xl p-1 border border-black/5 dark:border-white/10 shadow-md">
                    <button 
                        onClick={() => setActiveTab('workflow')}
                        className={`px-3 sm:px-5 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${activeTab === 'workflow' ? 'bg-violet-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'}`}
                    >
                        🎨 Workflow
                    </button>
                    <button 
                        onClick={() => setActiveTab('gallery')}
                        className={`px-3 sm:px-5 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${activeTab === 'gallery' ? 'bg-violet-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'}`}
                    >
                        🖼️ Gallery
                    </button>
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
                    <button onClick={toggleTheme} className="p-2 rounded-full border border-black/10 dark:border-white/10 bg-white dark:bg-[#151515] text-gray-600 dark:text-gray-300 hover:bg-neutral-100 dark:hover:bg-white/5 transition shadow-md">
                        {theme === 'dark' ? (
                            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                        ) : (
                            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                        )}
                    </button>
                </div>
            </nav>

            {/* Content Area */}
            <div className="flex-1 flex flex-col">
                {activeTab === 'workflow' ? (
                    /* ═══ WORKFLOW TAB ═══ */
                    comfyStatus === 'running' ? (
                        /* ComfyUI is running → show iframe */
                        <iframe
                            src={`http://127.0.0.1:8188`}
                            className="flex-1 w-full border-none"
                            title="ComfyUI Workflow"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
                        />
                    ) : (
                        /* ComfyUI not running → show launcher */
                        <div className="flex-1 flex items-center justify-center px-4">
                            <div className="max-w-md w-full text-center space-y-6 sm:space-y-8">
                                <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-3xl bg-gradient-to-br from-violet-500/20 to-emerald-500/20 border border-violet-500/20 flex items-center justify-center">
                                    <svg className="w-10 h-10 sm:w-12 sm:h-12 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                </div>

                                <div>
                                    <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900 dark:text-white mb-2">
                                        ComfyUI Studio
                                    </h2>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                                        Launch ComfyUI to start creating AI-generated artwork directly from within WaifuVault.
                                    </p>
                                </div>

                                {comfyStatus === 'starting' ? (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-center gap-3">
                                            <div className="w-5 h-5 border-2 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
                                            <span className="text-sm font-bold text-violet-400">Starting ComfyUI...</span>
                                        </div>
                                        <p className="text-xs text-gray-500">{startMessage}</p>
                                        <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                                            <div className="h-full bg-gradient-to-r from-violet-500 to-emerald-500 rounded-full animate-pulse" style={{ width: '60%' }} />
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        onClick={handleStart}
                                        className="px-8 py-3 sm:py-4 bg-gradient-to-r from-violet-600 to-emerald-600 hover:from-violet-700 hover:to-emerald-700 text-white font-bold rounded-2xl transition-all shadow-xl shadow-violet-500/20 hover:shadow-violet-500/40 hover:scale-105 text-sm sm:text-base"
                                    >
                                        ⚡ Start ComfyUI
                                    </button>
                                )}

                                <div className="text-[10px] sm:text-xs text-gray-500/50 pt-4 border-t border-white/5">
                                    <p>Path: C:\Users\Raphael\Documents\ComfyUI\run_nvidia_gpu.bat</p>
                                    <p>Server: 127.0.0.1:8188</p>
                                </div>
                            </div>
                        </div>
                    )
                ) : (
                    /* ═══ GALLERY TAB ═══ */
                    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8">
                        <div className="mb-6 sm:mb-8">
                            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900 dark:text-white mb-2">
                                🎨 My Generations
                            </h2>
                            <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">
                                Browse your locally generated ComfyUI artworks • {images.length} images
                            </p>
                        </div>

                        {/* Folder Tabs */}
                        <div className="flex items-center gap-2 mb-6 sm:mb-8 overflow-x-auto no-scrollbar pb-2">
                            {folders.map(folder => (
                                <button
                                    key={folder}
                                    onClick={() => setActiveFolder(folder)}
                                    className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all border shadow-sm ${
                                        activeFolder === folder
                                            ? 'bg-violet-600 text-white border-violet-600 shadow-violet-500/30'
                                            : 'bg-white dark:bg-[#151515] text-gray-600 dark:text-gray-300 border-black/5 dark:border-white/10 hover:border-violet-500/30 hover:text-violet-600 dark:hover:text-violet-400'
                                    }`}
                                >
                                    📁 {folder}
                                </button>
                            ))}
                        </div>

                        {/* Image Grid */}
                        {galleryLoading ? (
                            <div className="flex items-center justify-center h-[50vh]">
                                <Spinner label="Loading generations…" />
                            </div>
                        ) : images.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-[50vh] text-gray-500 dark:text-gray-400">
                                <svg className="w-12 h-12 sm:w-16 sm:h-16 mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <p className="text-base sm:text-lg font-bold">No images found</p>
                                <p className="text-xs sm:text-sm">This folder appears to be empty.</p>
                            </div>
                        ) : (
                            <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-3 sm:gap-4 space-y-3 sm:space-y-4">
                                {images.map((img) => (
                                    <div
                                        key={img.filename}
                                        onClick={() => { const waifu = comfyToWaifu(img); onImageClick(waifu, waifuImages); }}
                                        className="group relative break-inside-avoid rounded-xl sm:rounded-2xl overflow-hidden cursor-pointer bg-neutral-200 dark:bg-white/5 border border-black/5 dark:border-white/5 shadow-md hover:shadow-xl hover:ring-2 hover:ring-violet-500/50 transition-all duration-300"
                                    >
                                        <img
                                            src={img.url}
                                            alt={img.filename}
                                            className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                                            loading="lazy"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-2 sm:p-3">
                                            <div className="text-white">
                                                <p className="text-[10px] sm:text-xs font-bold truncate max-w-[150px] sm:max-w-[180px]">{img.filename}</p>
                                                <p className="text-[9px] sm:text-[10px] text-white/60">{(img.size / 1024 / 1024).toFixed(1)} MB</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
