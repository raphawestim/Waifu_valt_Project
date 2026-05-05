import React, { useState, useEffect, useCallback } from 'react';
import { HHAnime, HHSearchResponse } from '../services/hentaihaven/types';
import { hhService } from '../services/hhService';
import { HHAnimeCard } from './HHAnimeCard';
import { Spinner } from './Spinner';

const POPULAR_GENRES = [
    { label: 'Big Tits', value: 'big-tits' },
    { label: 'Uncensored', value: 'uncensored' },
    { label: 'Schoolgirl', value: 'school-girl' },
    { label: 'Fantasy', value: 'fantasy' },
    { label: 'Romance', value: 'romance' },
    { label: 'Yuri', value: 'yuri' },
    { label: 'MILF', value: 'milf' },
    { label: 'Harem', value: 'harem' },
    { label: 'Blowjob', value: 'blowjob' },
    { label: 'Creampie', value: 'creampie' },
    { label: 'Incest', value: 'incest' },
    { label: 'Public', value: 'public' },
    { label: 'Gangbang', value: 'gangbang' },
    { label: 'Orgy', value: 'orgy' },
    { label: 'Rape', value: 'rape' },
    { label: 'Softcore', value: 'softcore' },
];

export const HHView: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [results, setResults] = useState<HHAnime[]>([]);
    const [query, setQuery] = useState('');
    const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [showGenres, setShowGenres] = useState(false);

    const loadData = useCallback(async (isNewSearch = false) => {
        setLoading(true);
        try {
            let data: HHSearchResponse;
            const targetPage = isNewSearch ? 1 : page;
            
            if (selectedGenre) {
                data = await hhService.getByGenre(selectedGenre, targetPage);
            } else if (query.trim()) {
                data = await hhService.searchAnime(query, targetPage);
            } else {
                data = await hhService.getLatest(targetPage);
            }

            setResults(data.results);
            setTotalPages(data.totalPages);
            if (isNewSearch) setPage(1);
        } catch (error) {
            console.error('Error loading HH data:', error);
        } finally {
            setLoading(false);
        }
    }, [query, selectedGenre, page]);

    useEffect(() => {
        loadData();
    }, [page]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setSelectedGenre(null);
        loadData(true);
    };

    const handleGenreSelect = (genre: string) => {
        setSelectedGenre(genre);
        setQuery('');
        setShowGenres(false);
        loadData(true);
    };

    const clearFilters = () => {
        setSelectedGenre(null);
        setQuery('');
        loadData(true);
    };

    return (
        <div className="flex flex-col gap-6 p-6 animate-in fade-in duration-700">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-2">
                        <span className="text-indigo-500">Hentai</span>Haven
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">
                        {selectedGenre 
                            ? `Browsing genre: ${POPULAR_GENRES.find(g => g.value === selectedGenre)?.label}` 
                            : query 
                                ? `Results for: ${query}` 
                                : "Latest anime uploads"}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <form onSubmit={handleSearch} className="relative group">
                        <input 
                            type="text" 
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search anime..."
                            className="bg-neutral-900 border border-white/10 text-white px-4 py-2 pl-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 w-full md:w-64 transition-all"
                        />
                        <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-500 group-focus-within:text-indigo-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </form>

                    <div className="relative">
                        <button 
                            onClick={() => setShowGenres(!showGenres)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${showGenres || selectedGenre ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-neutral-900 border-white/10 text-gray-300 hover:border-white/30'}`}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                            <span className="font-medium">Genres</span>
                        </button>

                        {showGenres && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setShowGenres(false)} />
                                <div className="absolute right-0 mt-2 w-72 bg-neutral-900 border border-white/10 rounded-2xl shadow-2xl z-50 p-2 grid grid-cols-2 gap-1 animate-in zoom-in-95 duration-200 origin-top-right">
                                    {POPULAR_GENRES.map((genre) => (
                                        <button
                                            key={genre.value}
                                            onClick={() => handleGenreSelect(genre.value)}
                                            className={`text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors ${selectedGenre === genre.value ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                                        >
                                            {genre.label}
                                        </button>
                                    ))}
                                    <div className="col-span-2 border-t border-white/5 mt-1 pt-1">
                                        <button
                                            onClick={clearFilters}
                                            className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold text-rose-400 hover:bg-rose-500/10 transition-colors"
                                        >
                                            Clear filter — Show Latest
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Content Area */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-32 gap-4">
                    <Spinner label="Summoning anime from the refuge..." />
                </div>
            ) : results.length > 0 ? (
                <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                        {results.map((anime) => (
                            <HHAnimeCard 
                                key={anime.id} 
                                anime={anime} 
                                onClick={() => window.open(anime.url, '_blank')}
                            />
                        ))}
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-center gap-4 mt-8 pb-12">
                        <button 
                            disabled={page <= 1}
                            onClick={() => setPage(p => p - 1)}
                            className="p-2 rounded-xl bg-neutral-900 border border-white/10 text-white disabled:opacity-30 hover:border-indigo-500 transition-all"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        <span className="text-white font-bold bg-neutral-900 px-4 py-2 rounded-xl border border-white/10">
                            Page {page} of {totalPages}
                        </span>
                        <button 
                            disabled={page >= totalPages}
                            onClick={() => setPage(p => p + 1)}
                            className="p-2 rounded-xl bg-neutral-900 border border-white/10 text-white disabled:opacity-30 hover:border-indigo-500 transition-all"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                        </button>
                    </div>
                </>
            ) : (
                <div className="flex flex-col items-center justify-center py-32 text-center">
                    <div className="w-20 h-20 bg-neutral-900 rounded-full flex items-center justify-center mb-4 border border-white/5">
                        <svg className="w-10 h-10 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 9.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <h3 className="text-xl font-bold text-white">No anime found</h3>
                    <p className="text-gray-400 mt-2">Try a different search or genre.</p>
                    <button onClick={clearFilters} className="mt-6 px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-500 transition-colors">
                        Show Newest Uploads
                    </button>
                </div>
            )}
        </div>
    );
};
