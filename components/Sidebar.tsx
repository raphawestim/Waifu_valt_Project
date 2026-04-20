
import React, { useState, useEffect } from 'react';
import type { SearchOptions, SourceApi } from '../types';
import { POPULAR_TAGS, API_FAVICONS, WAIFU_IM_VERSATILE_TAGS, WAIFU_IM_NSFW_TAGS } from '../constants';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
    onFilterChange: (options: SearchOptions) => void;
    onSearch: (query: string) => void;
    onNavigate: (view: 'explore' | 'profile' | 'favorites' | 'home') => void;
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
        const isNsfwSource = source === 'rule34';
        
        const applyToggle = () => {
            setOptions(prev => {
                const newSources = prev.sources.includes(source)
                    ? prev.sources.filter(s => s !== source)
                    : [...prev.sources, source];
                
                const updated = { ...prev, sources: newSources };
                onFilterChange(updated);
                return updated;
            });
        };

        if (isNsfwSource && !options.isNsfwEnabled && !options.sources.includes(source)) {
            onRequestNsfw(() => {
                // Confirm
                setOptions(prev => {
                    const newSources = [...prev.sources, source];
                    const updated = { ...prev, isNsfwEnabled: true, sources: newSources };
                    onFilterChange(updated);
                    return updated;
                });
            }, () => {});
        } else {
            applyToggle();
        }
    };
    
    const setContentType = (type: 'all' | 'images' | 'videos' | 'gifs') => {
        const updated = { ...options, contentType: type };
        setOptions(updated);
        onFilterChange(updated);
    };

    const handleTagClick = (tag: string) => {
        const isNsfwTag = WAIFU_IM_NSFW_TAGS.includes(tag);
        
        const applyTag = () => {
            const newTags = options.tags.includes(tag)
                ? options.tags.filter(t => t !== tag)
                : [...options.tags, tag];
            const updated = { ...options, tags: newTags };
            setOptions(updated);
            onFilterChange(updated);
        };

        if (isNsfwTag && !options.isNsfwEnabled && !options.tags.includes(tag)) {
            onRequestNsfw(() => {
                 setOptions(prev => {
                    const newTags = [...prev.tags, tag];
                    const updated = { ...prev, isNsfwEnabled: true, tags: newTags };
                    onFilterChange(updated);
                    return updated;
                });
            }, () => {});
        } else {
            applyTag();
        }
    };

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 dark:bg-black/80 backdrop-blur-sm z-40 md:hidden"
                    onClick={onClose}
                />
            )}
            
            <aside className={`fixed top-0 left-0 h-full w-80 bg-white dark:bg-[#0d0d0d] border-r border-black/5 dark:border-white/5 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
                isOpen ? 'translate-x-0' : '-translate-x-full'
            }`}>
                <div className="p-6 border-b border-black/5 dark:border-white/5 sticky top-0 bg-white/80 dark:bg-[#0d0d0d]/80 backdrop-blur-md z-10 flex items-center justify-between">
                    <button 
                        onClick={() => onNavigate('home')} 
                        className="flex items-center gap-3 hover:opacity-75 transition-opacity focus:outline-none"
                        title="Go to Home"
                    >
                        <LogoIcon />
                        <h2 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">
                            WAIFU<span className="text-violet-600 dark:text-violet-500">VAULT</span>
                        </h2>
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
                                className="w-full bg-neutral-100 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                                placeholder="Search tags..."
                            />
                        </div>
                    </div>

                {/* Navigation Links */}
                <nav className="px-4 space-y-1 mb-8">
                    <button
                        onClick={() => onNavigate('explore')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                            currentView === 'explore'
                                ? 'bg-white dark:bg-[#1a1a1a] text-violet-600 dark:text-white shadow-sm dark:shadow-md border border-neutral-200 dark:border-white/10'
                                : 'text-gray-500 hover:bg-neutral-100 dark:hover:bg-white/5 hover:text-gray-700 dark:hover:text-gray-300 border border-transparent'
                        }`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
                        Explore Collection
                    </button>
                    <button
                        onClick={() => onNavigate('favorites')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                            currentView === 'favorites'
                                ? 'bg-white dark:bg-[#1a1a1a] text-violet-600 dark:text-white shadow-sm dark:shadow-md border border-neutral-200 dark:border-white/10'
                                : 'text-gray-500 hover:bg-neutral-100 dark:hover:bg-white/5 hover:text-gray-700 dark:hover:text-gray-300 border border-transparent'
                        }`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z"></path></svg>
                        My Favorites
                    </button>
                    <button
                        onClick={() => onNavigate('comfyui' as any)}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all text-gray-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 hover:text-emerald-600 dark:hover:text-emerald-400 border border-transparent"
                    >
                        <div className="w-5 h-5 flex items-center justify-center">
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                        </div>
                        ComfyUI Studio
                    </button>
                </nav>

                {/* Filters Section */}
                    {/* Content Types */}
                    <div>
                        <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Format</h4>
                        <div className="grid grid-cols-4 gap-1 p-1 bg-neutral-100 dark:bg-[#151515] rounded-xl border border-black/5 dark:border-white/5">
                        {(['all', 'images', 'videos', 'gifs'] as const).map(type => (
                            <button
                                key={type}
                                onClick={() => setContentType(type)}
                                className={`py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                                    options.contentType === type 
                                        ? 'bg-white dark:bg-[#222] text-violet-600 dark:text-white shadow-sm dark:shadow-md' 
                                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-300'
                                }`}
                            >
                                {type}
                            </button>
                        ))}
                        </div>
                    </div>

                    {/* API Sources */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">APIs & Sources</h3>
                            {options.sources.length === 0 && (
                                <span className="text-[10px] font-bold text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-500/20 px-2 py-0.5 rounded-full">
                                    All Sources
                                </span>
                            )}
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            {(['waifu.im', 'gelbooru', 'danbooru', 'rule34', 'konachan', 'yandere'] as const).map(source => (
                                <button
                                    key={source}
                                    onClick={() => toggleSource(source)}
                                    title={source}
                                    className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all border ${
                                        options.sources.includes(source)
                                            ? 'bg-violet-100 dark:bg-violet-600/20 border-violet-500/50 shadow-sm dark:shadow-violet-500/20'
                                            : 'bg-neutral-100 dark:bg-[#151515] border-transparent hover:border-black/10 dark:hover:border-white/10 opacity-70 hover:opacity-100 grayscale hover:grayscale-[0.5]'
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

                    {/* Popular Tags */}
                    <div>
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
                                    #{tag.replace(/_/g, '')}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Waifu.im Special Tags */}
                    {options.sources.includes('waifu.im') && (
                        <div className="animate-fade-in">
                            <h4 className="text-[10px] font-bold text-violet-400 uppercase tracking-widest mb-3">Waifu.im Tags</h4>
                                <div className="flex flex-wrap gap-2">
                                    {WAIFU_IM_VERSATILE_TAGS.map(tag => (
                                        <button
                                            key={tag}
                                            onClick={() => handleTagClick(tag)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                                                options.tags.includes(tag)
                                                    ? 'bg-violet-100 dark:bg-violet-600/20 text-violet-700 dark:text-violet-300 border-violet-500/50 shadow-sm'
                                                    : 'bg-neutral-100 dark:bg-[#151515] text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 border-black/5 dark:border-white/5 hover:border-black/20 dark:hover:border-white/20'
                                            }`}
                                        >
                                            #{tag}
                                        </button>
                                    ))}
                                </div>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {WAIFU_IM_NSFW_TAGS.map(tag => (
                                        <button
                                            key={tag}
                                            onClick={() => handleTagClick(tag)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                                                options.tags.includes(tag)
                                                    ? 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/50 shadow-sm'
                                                    : 'bg-neutral-100 dark:bg-[#151515] text-gray-500 hover:text-red-600 dark:hover:text-red-400 border-black/5 dark:border-white/5 hover:border-red-500/30'
                                            }`}
                                        >
                                            #{tag}
                                        </button>
                                    ))}
                                </div>
                        </div>
                    )}
                </div>

                {/* Footer / Auth Info */}
                <div className="p-6 border-t border-black/5 dark:border-white/5 bg-neutral-50 dark:bg-[#0a0a0a]">
                    <div className="text-[10px] text-gray-400 dark:text-gray-500 text-center">
                        Vault v2.0 • Inspired by High Art
                    </div>
                </div>
            </aside>
        </>
    );
};
