import React, { useState, useEffect } from 'react';
import type { NHentaiGallery } from '../types';
import { nhentaiService } from '../services/nhentaiService';
import { MangaCard } from './MangaCard';
import { MangaReaderModal } from './MangaReaderModal';
import { Spinner, FullScreenSpinner } from './Spinner';

interface NHentaiViewProps {
    onNavigateHome: () => void;
}

export const NHentaiView: React.FC<NHentaiViewProps> = ({ onNavigateHome }) => {
    const [query, setQuery] = useState('');
    const [popular, setPopular] = useState<NHentaiGallery[]>([]);
    const [newUploads, setNewUploads] = useState<NHentaiGallery[]>([]);
    const [searchResults, setSearchResults] = useState<NHentaiGallery[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedManga, setSelectedManga] = useState<NHentaiGallery | null>(null);

    useEffect(() => {
        const loadInitialData = async () => {
            setLoading(true);
            try {
                const pop = await nhentaiService.getPopularNow();
                const newUp = await nhentaiService.getNewUploads(1);
                setPopular(pop.result || []);
                setNewUploads(newUp.result || []);
            } catch (err: any) {
                console.error("Failed to load initial NHentai data", err);
                setError(err.message || 'Failed to load doujins. Check your API Key.');
            }
            setLoading(false);
        };
        loadInitialData();
    }, []);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) {
            setIsSearching(false);
            return;
        }
        setLoading(true);
        setIsSearching(true);
        setError('');
        try {
            const res = await nhentaiService.searchGalleries(query, 1);
            setSearchResults(res.result || []);
        } catch (err: any) {
            console.error("Search failed", err);
            setError(err.message || 'Search failed');
        }
        setLoading(false);
    };

    return (
        <div className="flex-1 min-h-screen pb-12">
            {/* Header / Search Bar */}
            <div className="sticky top-0 z-30 flex items-center gap-4 px-6 py-4 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-md border-b border-black/5 dark:border-white/5">
                <button onClick={onNavigateHome} className="lg:hidden p-2 hover:bg-white/10 rounded-lg transition">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                </button>
                <h1 className="text-xl font-bold tracking-tight text-rose-500 hidden sm:block">Manga Vault</h1>
                
                <form onSubmit={handleSearch} className="flex-1 max-w-2xl ml-auto relative">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search tags, parodies, characters..."
                        className="w-full bg-neutral-100 dark:bg-[#1a1a1a] border border-transparent focus:border-rose-500/50 text-sm px-4 py-2.5 rounded-xl outline-none transition shadow-inner dark:shadow-none placeholder-gray-500"
                    />
                    <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-500 hover:text-rose-500 transition">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </button>
                </form>
            </div>

            <div className="p-6">
                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl mb-6">
                        {error}
                    </div>
                )}

                {loading ? (
                    <FullScreenSpinner label="Loading Doujins..." />
                ) : (
                    <>
                        {isSearching ? (
                            <div>
                                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                                    <span className="text-rose-500">Search Results</span> for "{query}"
                                </h2>
                                {searchResults.length === 0 ? (
                                    <div className="text-gray-500">No doujins found for this search.</div>
                                ) : (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                                        {searchResults.map(g => (
                                            <MangaCard key={g.id} gallery={g} onClick={setSelectedManga} />
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-8">
                                {popular.length > 0 && (
                                    <div>
                                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                                            <svg className="w-5 h-5 text-rose-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" /></svg>
                                            Popular Now
                                        </h2>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                                            {popular.slice(0, 6).map(g => (
                                                <MangaCard key={g.id} gallery={g} onClick={setSelectedManga} />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {newUploads.length > 0 && (
                                    <div>
                                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                                            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            New Uploads
                                        </h2>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                                            {newUploads.map(g => (
                                                <MangaCard key={g.id} gallery={g} onClick={setSelectedManga} />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>

            {selectedManga && (
                <MangaReaderModal 
                    gallery={selectedManga} 
                    onClose={() => setSelectedManga(null)} 
                />
            )}
        </div>
    );
};
