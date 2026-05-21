
import React, { useState, useEffect } from 'react';
import type { SearchOptions, SourceApi } from '../types';
import { POPULAR_TAGS, API_FAVICONS, WAIFU_IM_VERSATILE_TAGS, WAIFU_IM_NSFW_TAGS } from '../constants';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
    onFilterChange: (options: SearchOptions) => void;
    onSearch: (query: string) => void;
    onNavigate: (view: any) => void;
    currentOptions: SearchOptions;
    isLoggedIn: boolean;
    currentView: string;
    onRequestNsfw: (onConfirm: () => void, onCancel: () => void) => void;
}

const LogoIcon = () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M2 17L12 22L22 17" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M2 12L12 17L22 12" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

const SearchIcon = () => (
    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
);

export const Sidebar: React.FC<SidebarProps> = ({ 
    isOpen, 
    onClose, 
    onFilterChange, 
    onSearch, 
    onNavigate, 
    currentOptions, 
    isLoggedIn, 
    currentView,
    onRequestNsfw
}) => {
    const [options, setOptions] = useState<SearchOptions>(currentOptions);
    const [localQuery, setLocalQuery] = useState(currentOptions.query);
    
    useEffect(() => {
        setOptions(currentOptions);
        setLocalQuery(currentOptions.query);
    }, [currentOptions]);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSearch(localQuery);
    };

    const toggleSource = (source: SourceApi) => {
        setOptions(prev => {
            const newSources = prev.sources.includes(source)
                ? prev.sources.filter(s => s !== source)
                : [...prev.sources, source];
            
            const updated = { ...prev, sources: newSources };
            onFilterChange(updated);
            return updated;
        });
    };
    
    const setContentType = (type: 'all' | 'images' | 'videos' | 'gifs') => {
        const updated = { ...options, contentType: type };
        setOptions(updated);
        onFilterChange(updated);
    };

    const handleTagClick = (tag: string) => {
        const newTags = options.tags.includes(tag)
            ? options.tags.filter(t => t !== tag)
            : [...options.tags, tag];
        const updated = { ...options, tags: newTags };
        setOptions(updated);
        onFilterChange(updated);
    };

    return (
        <>
            {isOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 dark:bg-black/80 backdrop-blur-sm z-40 md:hidden"
                    onClick={onClose}
                />
            )}
            
            <aside className={`fixed top-0 left-0 h-full w-80 bg-white dark:bg-[#07070d] border-r border-black/5 dark:border-white/10 shadow-2xl shadow-black/50 z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
                isOpen ? 'translate-x-0' : '-translate-x-full'
            }`}>
                <div className="p-6 border-b border-black/5 dark:border-white/10 sticky top-0 bg-white/80 dark:bg-[#07070d]/85 backdrop-blur-xl z-10 flex items-center justify-between">
                    <button 
                        onClick={() => onNavigate('home')} 
                        className="flex items-center gap-3 hover:opacity-75 transition-opacity focus:outline-none"
                    >
                        <LogoIcon />
                        <div className="flex flex-col items-start">
                            <h2 className="text-xl font-black tracking-tight text-gray-900 dark:text-white">
                                WAIFU<span className="text-violet-600 dark:text-violet-400">VAULT</span>
                            </h2>
                            <span className="-mt-0.5 rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.24em] text-red-300">
                                NSFW
                            </span>
                        </div>
                    </button>
                    <button onClick={onClose} className="md:hidden p-2 hover:bg-neutral-100 dark:hover:bg-white/10 rounded-lg text-gray-600 dark:text-gray-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-8 pb-24">
                    <div>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <SearchIcon />
                            </div>
                            <input
                                type="text"
                                value={localQuery}
                                onChange={(e) => setLocalQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit(e as any)}
                                className="w-full bg-neutral-100 dark:bg-black/35 border border-black/5 dark:border-white/10 rounded-2xl py-3 pl-10 pr-4 text-sm font-semibold text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-violet-500/15 focus:border-violet-400/60 transition-all"
                                placeholder="Search tags..."
                            />
                        </div>
                    </div>

                {/* Navigation Links */}
                <nav className="px-1 space-y-1">
                    <button
                        onClick={() => onNavigate('explore')}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                            currentView === 'explore'
                                ? 'bg-violet-500/15 text-violet-600 dark:text-white shadow-sm border border-violet-400/25'
                                : 'text-gray-500 hover:bg-neutral-100 dark:hover:bg-white/[0.07] hover:text-gray-700 dark:hover:text-gray-200'
                        }`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
                        The Vault NSFW
                    </button>
                    
                    <div className="py-2 border-t border-black/5 dark:border-white/5 my-2">
                        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-4 mb-2">Discovery</h4>
                        <button onClick={() => onNavigate('artists')} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${currentView === 'artists' ? 'text-violet-500 bg-violet-500/5' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                            Artists
                        </button>
                        <button onClick={() => onNavigate('characters')} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${currentView === 'characters' ? 'text-violet-500 bg-violet-500/5' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            Characters
                        </button>
                        <button onClick={() => onNavigate('metadata')} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${currentView === 'metadata' ? 'text-violet-500 bg-violet-500/5' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"></path></svg>
                            Metadata
                        </button>
                    </div>

                    <button
                        onClick={() => onNavigate('favorites')}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                            currentView === 'profile'
                                ? 'bg-rose-500/10 text-rose-500 dark:text-white shadow-sm border border-rose-400/25'
                                : 'text-gray-500 hover:bg-neutral-100 dark:hover:bg-white/[0.07] hover:text-gray-700 dark:hover:text-gray-200'
                        }`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z"></path></svg>
                        My Favorites
                    </button>
                    <button
                        onClick={() => onNavigate('comfyui')}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                            currentView === 'comfyui'
                                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                : 'text-gray-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 hover:text-emerald-600 dark:hover:text-emerald-400'
                        }`}
                    >
                        <div className="w-5 h-5 flex items-center justify-center">
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                        </div>
                        ComfyUI Studio
                    </button>
                    <button
                        onClick={() => onNavigate('prompt-lab')}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                            currentView === 'prompt-lab'
                                ? 'bg-violet-500/10 text-violet-500 border-violet-500/20 shadow-sm border'
                                : 'text-gray-500 hover:bg-violet-50 dark:hover:bg-violet-900/10 hover:text-violet-600 dark:hover:text-violet-400 border border-transparent'
                        }`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3h6m-7 4h8m-9 4h10m-8 4h6m-3 6a9 9 0 100-18 9 9 0 000 18z"></path></svg>
                        Prompt Lab
                    </button>
                    <button
                        onClick={() => onNavigate('settings')}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                            currentView === 'settings'
                                ? 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20 shadow-sm border'
                                : 'text-gray-500 hover:bg-cyan-50 dark:hover:bg-cyan-900/10 hover:text-cyan-600 dark:hover:text-cyan-400 border border-transparent'
                        }`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                        AI Settings
                    </button>
                    
                    <button
                        onClick={() => onNavigate('nhentai')}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                            currentView === 'nhentai'
                                ? 'bg-rose-500/10 text-rose-500 border-rose-500/20 shadow-sm border'
                                : 'text-gray-500 hover:bg-rose-50 dark:hover:bg-rose-900/10 hover:text-rose-600 dark:hover:text-rose-400 border border-transparent'
                        }`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
                        Manga / Doujins
                    </button>
                    <button
                        onClick={() => onNavigate('ehentai')}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                            currentView === 'ehentai'
                                ? 'bg-fuchsia-500/10 text-fuchsia-500 border-fuchsia-500/20 shadow-sm border'
                                : 'text-gray-500 hover:bg-fuchsia-50 dark:hover:bg-fuchsia-900/10 hover:text-fuchsia-600 dark:hover:text-fuchsia-400 border border-transparent'
                        }`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2m14 0V7a2 2 0 00-2-2h-1m-8 0H7a2 2 0 00-2 2v4m8-6v6"></path></svg>
                        E-Hentai
                    </button>
                    <button
                        onClick={() => onNavigate('rule34video')}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                            currentView === 'rule34video'
                                ? 'bg-orange-500/10 text-orange-500 border-orange-500/20 shadow-sm border'
                                : 'text-gray-500 hover:bg-orange-50 dark:hover:bg-orange-900/10 hover:text-orange-600 dark:hover:text-orange-400 border border-transparent'
                        }`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        Rule34Video
                    </button>
                    <button
                        onClick={() => onNavigate('hentaihaven')}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                            currentView === 'hentaihaven'
                                ? 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20 shadow-sm border'
                                : 'text-gray-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 hover:text-indigo-600 dark:hover:text-indigo-400 border border-transparent'
                        }`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                        HentaiHaven
                    </button>
                </nav>

                    <div className="pt-8 block">
                        <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Format</h4>
                        <div className="grid grid-cols-4 gap-1 p-1 bg-neutral-100 dark:bg-black/35 rounded-2xl border border-black/5 dark:border-white/10">
                        {(['all', 'images', 'videos', 'gifs'] as const).map(type => (
                            <button
                                key={type}
                                onClick={() => setContentType(type)}
                                className={`py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                                    options.contentType === type 
                                        ? 'bg-white dark:bg-white text-violet-600 dark:text-black shadow-sm' 
                                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-300'
                                }`}
                            >
                                {type}
                            </button>
                        ))}
                        </div>
                    </div>

                    <div className="pt-8">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">APIs & Sources</h3>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            {(['waifu.im', 'gelbooru', 'rule34', 'konachan', 'yandere', 'danbooru'] as SourceApi[]).map(source => (
                                <button
                                    key={source}
                                    onClick={() => toggleSource(source)}
                                    title={source}
                                    className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all border ${
                                        options.sources.includes(source)
                                            ? 'bg-violet-100 dark:bg-violet-600/20 border-violet-400/50 shadow-[0_0_22px_rgba(139,92,246,0.14)]'
                                            : 'bg-neutral-100 dark:bg-black/30 border-white/5 hover:border-black/10 dark:hover:border-white/15 opacity-75 hover:opacity-100 grayscale hover:grayscale-[0.5]'
                                    }`}
                                >
                                    <img src={API_FAVICONS[source]} alt={source} className="w-6 h-6 mb-1 object-contain drop-shadow-sm" />
                                    <span className={`text-[10px] font-bold ${options.sources.includes(source) ? 'text-violet-700 dark:text-violet-300' : 'text-gray-500'}`}>
                                        {source.split('.')[0]}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="pt-8">
                        <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Popular Tags</h4>
                        <div className="flex flex-wrap gap-2">
                            {POPULAR_TAGS.map(tag => (
                                <button
                                    key={tag}
                                    onClick={() => handleTagClick(tag)}
                                    className={`px-2.5 py-1 text-[11px] rounded-full transition-all border ${
                                        options.tags.includes(tag) 
                                            ? 'bg-violet-100 dark:bg-violet-600 text-violet-700 dark:text-white font-bold border-violet-500/50 dark:border-violet-600 shadow-sm' 
                                            : 'bg-neutral-100 dark:bg-[#1a1a1a] text-gray-500 hover:text-gray-700 dark:text-gray-400 border-black/5 dark:border-white/5 hover:border-black/20 dark:hover:border-white/20 dark:hover:text-white'
                                    }`}
                                >
                                    #{tag.replace(/_/g, ' ')}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Waifu.im exclusive tags — only shown when waifu.im is an active/selected source */}
                    {(options.sources.length === 0 || options.sources.includes('waifu.im')) && (
                        <div className="pt-2">
                            <h4 className="text-[10px] font-bold text-violet-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                                <img src="https://waifu.im/favicon.ico" className="w-3 h-3" alt="" />
                                Waifu.im Tags
                            </h4>
                            <div className="flex flex-wrap gap-2 mb-3">
                                {WAIFU_IM_VERSATILE_TAGS.map(tag => (
                                    <button
                                        key={tag}
                                        onClick={() => handleTagClick(tag)}
                                        className={`px-2.5 py-1 text-[11px] rounded-full transition-all border ${
                                            options.tags.includes(tag)
                                                ? 'bg-violet-100 dark:bg-violet-600 text-violet-700 dark:text-white font-bold border-violet-500/50 dark:border-violet-600 shadow-sm'
                                                : 'bg-neutral-100 dark:bg-[#1a1a1a] text-gray-500 hover:text-gray-700 dark:text-gray-400 border-black/5 dark:border-white/5 hover:border-black/20 dark:hover:border-white/20 dark:hover:text-white'
                                        }`}
                                    >
                                        #{tag}
                                    </button>
                                ))}
                            </div>
                                <div className="flex flex-wrap gap-2">
                                    {WAIFU_IM_NSFW_TAGS.map(tag => (
                                        <button
                                            key={tag}
                                            onClick={() => handleTagClick(tag)}
                                            className={`px-2.5 py-1 text-[11px] rounded-full transition-all border ${
                                                options.tags.includes(tag)
                                                    ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 font-bold border-red-400/50 shadow-sm'
                                                    : 'bg-neutral-100 dark:bg-[#1a1a1a] text-gray-500 hover:text-red-50 dark:text-gray-400 border-black/5 dark:border-white/5 hover:border-red-400/40'
                                            }`}
                                        >
                                            🔞 #{tag}
                                        </button>
                                    ))}
                                </div>
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-black/5 dark:border-white/10 bg-neutral-50 dark:bg-[#05050a]">
                    <div className="text-[10px] text-gray-400 dark:text-gray-500 text-center">
                        Vault v2.0 • Inspired by High Art
                    </div>
                </div>
            </aside>
        </>
    );
};
