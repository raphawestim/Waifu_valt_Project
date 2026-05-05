import React, { useState, useEffect, useRef } from 'react';
import { r34videoService } from '../services/r34videoService';
import { R34VideoSearchResult } from '../services/rule34video/types';
import { R34VideoCard } from './R34VideoCard';
import { Spinner } from './Spinner';

interface R34VideoViewProps {
    onSelectVideo: (video: R34VideoSearchResult) => void;
}

const SearchIcon = () => (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>);
const TagIcon = () => (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path></svg>);

const POPULAR_CATEGORIES = [
    'Overwatch', 'Genshin Impact', 'Fortnite', 'League of Legends', 'Elden Ring',
    'Final Fantasy', 'Resident Evil', 'Valorant', 'Cyberpunk 2077', 'Nier Automata',
    'Street Fighter', 'Zelda', 'Pokemon', 'Minecraft', 'Dragon Ball',
    'One Piece', 'Naruto', 'Attack on Titan', 'My Hero Academia', 'Demon Slayer',
    'Jujutsu Kaisen', 'Chainsaw Man', 'Evangelion', 'Spy x Family', 'Bleach',
    'Mass Effect', 'The Witcher', 'Mortal Kombat', 'Dead or Alive', 'Tomb Raider',
    'Metal Gear', 'Apex Legends', 'Halo', 'Persona', 'Fire Emblem',
];

export const R34VideoView: React.FC<R34VideoViewProps> = ({ onSelectVideo }) => {
    const [query, setQuery] = useState('');
    const [activeQuery, setActiveQuery] = useState<string | null>(null); // null = showing latest
    const [results, setResults] = useState<R34VideoSearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [showTags, setShowTags] = useState(false);
    const tagsRef = useRef<HTMLDivElement>(null);

    // Close tags dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (tagsRef.current && !tagsRef.current.contains(e.target as Node)) {
                setShowTags(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const loadLatest = async (targetPage: number) => {
        setLoading(true);
        setError(null);
        try {
            const data = await r34videoService.getLatestVideos(targetPage);
            setResults(data.results);
            setTotalPages(data.totalPages || 99);
            setPage(data.currentPage);
            setActiveQuery(null);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch latest videos');
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    const performSearch = async (searchQuery: string, targetPage: number) => {
        if (!searchQuery.trim()) return;
        setLoading(true);
        setError(null);
        try {
            const data = await r34videoService.searchVideos(searchQuery, targetPage);
            setResults(data.results);
            setTotalPages(data.totalPages || 99);
            setPage(data.currentPage);
            setActiveQuery(searchQuery);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch videos');
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) {
            setPage(1);
            loadLatest(1);
            return;
        }
        setPage(1);
        performSearch(query, 1);
    };

    const handleTagClick = (tag: string) => {
        setQuery(tag);
        setShowTags(false);
        setPage(1);
        performSearch(tag, 1);
    };

    const handlePrevPage = () => {
        if (page > 1) {
            const newPage = page - 1;
            if (activeQuery) performSearch(activeQuery, newPage);
            else loadLatest(newPage);
        }
    };

    const handleNextPage = () => {
        if (page < totalPages) {
            const newPage = page + 1;
            if (activeQuery) performSearch(activeQuery, newPage);
            else loadLatest(newPage);
        }
    };

    // Initial load: show newest
    useEffect(() => {
        loadLatest(1);
    }, []);

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 animate-fade-in bg-[#0f0f13] min-h-screen">
            <div className="max-w-7xl mx-auto w-full space-y-6">
                
                {/* Header & Search */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-neutral-900/50 p-6 rounded-2xl border border-white/5 backdrop-blur-xl">
                    <div>
                        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-orange-500">
                            Rule34Video
                        </h1>
                        <p className="text-gray-400 mt-1 text-sm">
                            {activeQuery 
                                ? <>Results for: <strong className="text-white">{activeQuery}</strong></>
                                : 'Newest uploads'
                            }
                        </p>
                    </div>
                    
                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <form onSubmit={handleSearch} className="relative flex-1 md:w-80 group">
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search videos..."
                                className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 transition-all shadow-inner group-hover:border-white/20"
                            />
                            <button type="submit" className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-rose-400 transition-colors">
                                <SearchIcon />
                            </button>
                        </form>

                        {/* Tags Button */}
                        <div className="relative" ref={tagsRef}>
                            <button
                                onClick={() => setShowTags(!showTags)}
                                className={`flex items-center gap-2 px-4 py-3 rounded-xl border font-bold text-sm transition-all whitespace-nowrap ${
                                    showTags
                                        ? 'bg-orange-500/20 border-orange-500/50 text-orange-400'
                                        : 'bg-black/50 border-white/10 text-gray-400 hover:text-white hover:border-white/20'
                                }`}
                            >
                                <TagIcon />
                                <span className="hidden sm:inline">Tags</span>
                            </button>
                            
                            {showTags && (
                                <div className="absolute right-0 top-full mt-2 w-[340px] max-h-[400px] overflow-y-auto bg-neutral-900 border border-white/10 rounded-2xl shadow-2xl z-50 p-4 animate-fade-in no-scrollbar">
                                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Popular Categories</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {POPULAR_CATEGORIES.map(tag => (
                                            <button
                                                key={tag}
                                                onClick={() => handleTagClick(tag)}
                                                className={`px-3 py-1.5 text-xs rounded-lg transition-all border font-medium ${
                                                    activeQuery === tag
                                                        ? 'bg-orange-500/20 border-orange-500/50 text-orange-300'
                                                        : 'bg-white/5 border-white/5 text-gray-400 hover:text-white hover:bg-white/10 hover:border-white/20'
                                                }`}
                                            >
                                                {tag}
                                            </button>
                                        ))}
                                    </div>
                                    {activeQuery && (
                                        <button
                                            onClick={() => { setShowTags(false); setQuery(''); setPage(1); loadLatest(1); }}
                                            className="mt-4 w-full py-2 text-xs font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg hover:bg-rose-500/20 transition-all"
                                        >
                                            ✕ Clear filter — Show Newest
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="min-h-[400px] relative">
                    {loading && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0f0f13]/80 backdrop-blur-sm z-10 rounded-xl">
                            <Spinner />
                            <p className="text-rose-400 mt-4 font-medium animate-pulse">Fetching videos...</p>
                        </div>
                    )}

                    {error && !loading && (
                        <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-6 rounded-xl text-center">
                            <svg className="w-12 h-12 mx-auto mb-3 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                            <h3 className="text-lg font-bold">Search Failed</h3>
                            <p className="text-sm mt-1">{error}</p>
                        </div>
                    )}

                    {!loading && !error && results.length === 0 && (
                        <div className="text-center py-20 text-gray-500">
                            <svg className="w-16 h-16 mx-auto mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"></path></svg>
                            <p className="text-lg">No videos found. Try a different search term.</p>
                        </div>
                    )}

                    {!loading && !error && results.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                            {results.map((video) => (
                                <R34VideoCard 
                                    key={video.id} 
                                    video={video} 
                                    onClick={() => onSelectVideo(video)} 
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {!loading && !error && results.length > 0 && (
                    <div className="flex items-center justify-center gap-4 py-8">
                        <button 
                            onClick={handlePrevPage}
                            disabled={page <= 1}
                            className="px-6 py-2.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium transition-colors flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                            Prev
                        </button>
                        
                        <span className="text-gray-400 font-medium px-4 py-2 bg-black/40 rounded-lg border border-white/5">
                            Page <strong className="text-white">{page}</strong>
                        </span>

                        <button 
                            onClick={handleNextPage}
                            className="px-6 py-2.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-medium transition-colors flex items-center gap-2"
                        >
                            Next
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                        </button>
                    </div>
                )}
                
            </div>
        </div>
    );
};
