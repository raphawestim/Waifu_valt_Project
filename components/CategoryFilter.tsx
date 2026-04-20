
import React, { useState, useEffect } from 'react';
import type { SearchOptions, SourceApi } from '../types';
import { API_FAVICONS } from '../constants';

interface CategoryFilterProps {
    options: SearchOptions;
    onFilterChange: (options: SearchOptions) => void;
    onSearch?: (query: string) => void;
}

const SearchIcon = () => (
    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
);

export const CategoryFilter: React.FC<CategoryFilterProps> = ({ options, onFilterChange, onSearch }) => {
    const [localQuery, setLocalQuery] = useState(options.query);

    useEffect(() => {
        setLocalQuery(options.query);
    }, [options.query]);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (onSearch) {
            onSearch(localQuery);
        } else {
            onFilterChange({ ...options, query: localQuery });
        }
    };
    
    const toggleSource = (source: SourceApi) => {
        const currentSources = options.sources;
        let newSources: SourceApi[];
        
        if (currentSources.includes(source)) {
            // Don't allow removing the last source
            if (currentSources.length === 1) return;
            newSources = currentSources.filter(s => s !== source);
        } else {
            newSources = [...currentSources, source];
        }
        
        onFilterChange({ ...options, sources: newSources });
    };

    const toggleContentType = (type: 'all' | 'images' | 'videos' | 'gifs') => {
        onFilterChange({ ...options, contentType: type });
    };

    // Helper to check if a source is active
    const isSourceActive = (source: SourceApi) => options.sources.includes(source);

    return (
        <div className="sticky top-[68px] z-40 w-full bg-white/95 dark:bg-[#141414]/95 backdrop-blur-sm border-b border-black/5 dark:border-gray-800 pb-2 pt-2 px-4 md:px-12">
            <div className="flex flex-col md:flex-row md:items-center space-y-3 md:space-y-0 md:space-x-4 overflow-x-auto no-scrollbar py-2">
                
                {/* Integrated Search Bar */}
                <form onSubmit={handleSearchSubmit} className="flex-shrink-0 w-full md:w-64 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <SearchIcon />
                    </div>
                    <input
                        type="text"
                        className="w-full bg-gray-800 text-gray-100 border border-gray-700 rounded-full py-1.5 pl-10 pr-4 text-sm focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors"
                        placeholder="Search tags..."
                        value={localQuery}
                        onChange={(e) => setLocalQuery(e.target.value)}
                    />
                </form>

                <div className="flex items-center space-x-4 overflow-x-auto no-scrollbar">
                    {/* Sources Group */}
                    <div className="flex items-center space-x-2 border-r border-gray-700 pr-4 flex-shrink-0">
                        <span className="text-xs font-bold text-gray-500 uppercase mr-1 hidden sm:inline-block">APIs</span>
                        {(['waifu.im', 'gelbooru', 'danbooru', 'konachan', 'rule34', 'yandere'] as const).map(source => (
                            <button
                                key={source}
                                onClick={() => toggleSource(source)}
                                className={`
                                    flex items-center space-x-2 px-3 py-1.5 rounded-full text-sm font-medium border transition-all flex-shrink-0
                                    ${isSourceActive(source) 
                                        ? 'bg-white text-black border-white hover:bg-gray-200' 
                                        : 'bg-transparent text-gray-300 border-gray-600 hover:border-gray-400 hover:text-white'}
                                `}
                            >
                                <img src={API_FAVICONS[source]} className="w-4 h-4 rounded-full bg-white/10" alt="" />
                                <span className="capitalize">{source.replace('.im', '')}</span>
                            </button>
                        ))}
                    </div>

                    {/* Types Group */}
                    <div className="flex items-center space-x-2 flex-shrink-0">
                        <span className="text-xs font-bold text-gray-500 uppercase mr-1 hidden sm:inline-block">Type</span>
                        {(['all', 'images', 'videos', 'gifs'] as const).map(type => (
                            <button
                                key={type}
                                onClick={() => toggleContentType(type)}
                                className={`
                                    px-4 py-1.5 rounded-full text-sm font-medium border transition-all capitalize flex-shrink-0
                                    ${options.contentType === type 
                                        ? 'bg-white text-black border-white' 
                                        : 'bg-transparent text-gray-300 border-gray-600 hover:border-gray-400 hover:text-white'}
                                `}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
};
