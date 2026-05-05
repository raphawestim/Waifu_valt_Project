import React, { useState } from 'react';
import type { SearchOptions, SourceApi } from '../types';
import { API_FAVICONS } from '../constants';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

interface HomeViewProps {
    currentOptions: SearchOptions;
    onSearchSubmit: (options: SearchOptions) => void;
    onRequestNsfw: (onConfirm: () => void, onCancel: () => void) => void;
    onAuthRequest: () => void;
    onImageClick?: (image: any, collection: any[]) => void;
    onNavigateHome?: () => void;
    onNavigateComfyUI?: () => void;
    onNavigateArtists?: () => void;
    onNavigateCharacters?: () => void;
    onNavigateMetadata?: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ 
    currentOptions, 
    onSearchSubmit, 
    onRequestNsfw, 
    onAuthRequest, 
    onNavigateHome, 
    onNavigateComfyUI,
    onNavigateArtists,
    onNavigateCharacters,
    onNavigateMetadata
}) => {
    const [localQuery, setLocalQuery] = useState(currentOptions.query);
    const [localOptions, setLocalOptions] = useState<SearchOptions>(currentOptions);
    
    const { user } = useAuth();
    const { theme, toggleTheme } = useTheme();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSearchSubmit({ ...localOptions, query: localQuery });
    };

    const toggleNsfwGlobal = () => {
        if (!localOptions.isNsfwEnabled) {
            onRequestNsfw(() => {
                setLocalOptions(prev => ({ ...prev, isNsfwEnabled: true }));
            }, () => {});
        } else {
            setLocalOptions(prev => ({ ...prev, isNsfwEnabled: false }));
        }
    };

    const toggleSource = (source: SourceApi) => {
        const isNsfwSource = source === 'rule34';
        const applyToggle = () => {
            setLocalOptions(prev => {
                const newSources = prev.sources.includes(source)
                    ? prev.sources.filter(s => s !== source)
                    : [...prev.sources, source];
                return { ...prev, sources: newSources };
            });
        };

        if (isNsfwSource && !localOptions.isNsfwEnabled && !localOptions.sources.includes(source)) {
            onRequestNsfw(() => {
                setLocalOptions(prev => ({ ...prev, isNsfwEnabled: true, sources: [...prev.sources, source] }));
            }, () => {});
        } else {
            applyToggle();
        }
    };
    
    const setContentType = (type: 'all' | 'images' | 'videos' | 'gifs') => {
        setLocalOptions(prev => ({ ...prev, contentType: type }));
    };

    return (
        <div className="w-full min-h-screen relative flex flex-col bg-neutral-50 dark:bg-[#0a0a0a] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] transition-colors duration-500 overflow-hidden from-violet-100/50 via-neutral-50 to-neutral-50 dark:from-[#1f1035] dark:via-[#0a0a0a] dark:to-[#0a0a0a]">
            
            {/* Top Navigation Bar */}
            <nav className="sticky top-0 inset-x-0 px-4 sm:px-6 py-3 sm:py-4 flex flex-wrap justify-between items-center gap-3 z-20 bg-neutral-50/80 dark:bg-[#0a0a0a]/80 backdrop-blur-md border-b border-black/5 dark:border-white/5">
                {/* Left Side: NSFW Mode Toggle + ComfyUI */}
                <div className="flex items-center gap-2 sm:gap-3">
                    <button 
                        onClick={toggleNsfwGlobal}
                        className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-full border transition font-bold shadow-md text-xs sm:text-sm ${localOptions.isNsfwEnabled ? 'bg-red-500/10 border-red-500 text-red-600 dark:text-red-400' : 'bg-white dark:bg-[#151515] border-black/10 dark:border-white/10 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}
                    >
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill={localOptions.isNsfwEnabled ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                        </svg>
                        <span className="hidden sm:inline">{localOptions.isNsfwEnabled ? 'NSFW Enabled' : 'NSFW Disabled'}</span>
                        <span className="sm:hidden">{localOptions.isNsfwEnabled ? 'NSFW' : 'SFW'}</span>
                    </button>

                    <button
                        onClick={onNavigateComfyUI}
                        className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-full border border-emerald-500/30 bg-white dark:bg-[#151515] text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/50 transition font-bold shadow-md text-xs sm:text-sm"
                    >
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        ComfyUI
                    </button>
                </div>

                {/* Center: Artists, Characters, Metadata */}
                <div className="flex items-center bg-white/50 dark:bg-white/5 backdrop-blur-md rounded-full px-1 sm:px-2 py-1 sm:py-1.5 border border-black/5 dark:border-white/5 shadow-2xl order-last md:order-none w-full md:w-auto justify-center">
                    <button onClick={onNavigateArtists} className="px-3 sm:px-6 py-2 text-[10px] sm:text-xs font-black uppercase tracking-widest text-gray-400 hover:text-violet-500 transition-colors">Artists</button>
                    <div className="w-px h-4 bg-gray-500/20" />
                    <button onClick={onNavigateCharacters} className="px-3 sm:px-6 py-2 text-[10px] sm:text-xs font-black uppercase tracking-widest text-gray-400 hover:text-violet-500 transition-colors">Characters</button>
                    <div className="w-px h-4 bg-gray-500/20" />
                    <button onClick={onNavigateMetadata} className="px-3 sm:px-6 py-2 text-[10px] sm:text-xs font-black uppercase tracking-widest text-gray-400 hover:text-violet-500 transition-colors">Metadata</button>
                </div>

                {/* Right Side: Theme & Auth */}
                <div className="flex items-center gap-2 sm:gap-4">
                    <button onClick={toggleTheme} className="p-2 rounded-full border border-black/10 dark:border-white/10 bg-white dark:bg-[#151515] text-gray-600 dark:text-gray-300 hover:bg-neutral-100 dark:hover:bg-white/5 transition shadow-md">
                        {theme === 'dark' ? (
                            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                        ) : (
                            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                        )}
                    </button>

                    {user ? (
                        <div className="flex items-center gap-2 group cursor-pointer bg-white dark:bg-[#151515] border border-black/10 dark:border-white/10 px-3 sm:px-4 py-1.5 rounded-full shadow-md">
                            <span className="text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300">{user.username}</span>
                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} className="w-6 h-6 rounded-full bg-violet-100 dark:bg-violet-900/30" alt="avatar" />
                        </div>
                    ) : (
                        <button 
                            onClick={onAuthRequest}
                            className="px-4 sm:px-5 py-2 bg-black dark:bg-violet-600 hover:bg-neutral-800 dark:hover:bg-violet-700 text-white rounded-full text-xs sm:text-sm font-bold transition shadow-lg shadow-black/20 dark:shadow-violet-900/40"
                        >
                            Log/In • Join
                        </button>
                    )}
                </div>
            </nav>

            {/* Centered Content Area */}
            <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-8 sm:py-12">
                <div className="w-full max-w-2xl text-center flex flex-col items-center animate-fade-in">
                    <div className="mb-8 sm:mb-10 flex flex-col items-center">
                        <button
                            type="button"
                            onClick={onNavigateHome}
                            className="flex flex-col items-center group focus:outline-none"
                        >
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="sm:w-16 sm:h-16 mb-4 sm:mb-6 drop-shadow-[0_0_15px_rgba(139,92,246,0.3)] dark:drop-shadow-[0_0_15px_rgba(139,92,246,0.5)] group-hover:scale-110 transition-transform duration-300">
                                <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="url(#violet-grad)" stroke="#a78bfa" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M2 17L12 22L22 17" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M2 12L12 17L22 12" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <defs>
                                    <linearGradient id="violet-grad" x1="2" y1="2" x2="22" y2="12" gradientUnits="userSpaceOnUse">
                                        <stop stopColor="#8b5cf6" stopOpacity="0.8"/>
                                        <stop offset="1" stopColor="#c4b5fd" stopOpacity="0.1"/>
                                    </linearGradient>
                                </defs>
                            </svg>
                            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter text-gray-900 dark:text-white mb-2 group-hover:opacity-80 transition-opacity">
                                WAIFU<span className="text-transparent bg-clip-text bg-gradient-to-br from-violet-500 to-violet-700 dark:from-violet-400 dark:to-violet-600">VAULT</span>
                            </h1>
                        </button>
                        <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base font-medium">The ultimate high-fidelity repository</p>
                    </div>

                    <form onSubmit={handleSubmit} className="w-full relative group mb-8 sm:mb-10">
                        <div className="absolute inset-y-0 left-4 sm:left-5 flex items-center pointer-events-none">
                            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-violet-500/50 dark:text-violet-400/50 group-focus-within:text-violet-600 dark:group-focus-within:text-violet-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                        </div>
                        <input
                            type="text"
                            value={localQuery}
                            onChange={(e) => setLocalQuery(e.target.value)}
                            className="w-full bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-full py-3.5 sm:py-4 md:py-5 pl-12 sm:pl-14 pr-24 sm:pr-28 text-base sm:text-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 focus:bg-white dark:focus:bg-white/10 transition-all shadow-xl shadow-black/5 dark:shadow-black/50 backdrop-blur-md"
                            placeholder="Search tags or character names..."
                        />
                        <button 
                            type="submit" 
                            className="absolute right-1.5 sm:right-2 top-1.5 sm:top-2 bottom-1.5 sm:bottom-2 px-4 sm:px-6 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-full transition shadow-lg shadow-violet-500/30 dark:shadow-violet-900/30 text-sm sm:text-base"
                        >
                            Explore
                        </button>
                    </form>

                    <div className="w-full max-w-lg mb-6 sm:mb-8">
                        <div className="grid grid-cols-4 gap-1.5 sm:gap-2 bg-white dark:bg-[#111] p-1 sm:p-1.5 rounded-2xl border border-black/5 dark:border-white/5 shadow-md">
                            {(['all', 'images', 'videos', 'gifs'] as const).map(type => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => setContentType(type)}
                                    className={`py-2 rounded-xl text-xs sm:text-sm font-bold capitalize transition-all ${localOptions.contentType === type ? 'bg-gray-100 dark:bg-[#222] text-violet-600 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-800 dark:text-gray-500 dark:hover:text-gray-300'}`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                        <span className="text-xs sm:text-sm font-bold text-gray-500 dark:text-gray-400 mr-1 sm:mr-2">Sources:</span>
                        {(['waifu.im', 'gelbooru', 'rule34', 'konachan', 'yandere'] as const).map(source => (
                            <button
                                key={source}
                                type="button"
                                onClick={() => toggleSource(source)}
                                title={source}
                                className={`w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl transition-all border shadow-sm ${localOptions.sources.includes(source) ? 'bg-violet-100 dark:bg-violet-600/20 border-violet-500/50 shadow-violet-500/20 grayscale-0 scale-110' : 'bg-white dark:bg-[#151515] border-black/5 dark:border-white/5 grayscale opacity-70 hover:grayscale-[0.5] hover:opacity-100 hover:border-black/20 dark:hover:border-white/20'}`}
                            >
                                <img src={API_FAVICONS[source]} alt={source} className="w-4 h-4 sm:w-5 sm:h-5 object-contain drop-shadow-sm" />
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
