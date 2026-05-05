
import React, { useState, useEffect } from 'react';
import { fetchExplorerTags, getTagPreview } from '../services/imageService';
import { Spinner } from './Spinner';

interface TagExplorerViewProps {
    type: 'artists' | 'characters' | 'metadata';
    onTagClick: (tag: string) => void;
    onNavigateHome: () => void;
}

const ALPHABET = '#ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

const TagCard: React.FC<{ tag: string; index: number; onClick: (tag: string) => void }> = ({ tag, index, onClick }) => {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [imgError, setImgError] = useState(false);

    useEffect(() => {
        let isMounted = true;
        // Stagger requests to avoid rate-limiting (200ms per card)
        const timer = setTimeout(() => {
            getTagPreview(tag).then(url => {
                if (isMounted) {
                    setPreviewUrl(url);
                    setLoading(false);
                }
            });
        }, index * 200);

        return () => { 
            isMounted = false; 
            clearTimeout(timer);
        };
    }, [tag, index]);

    return (
        <button
            onClick={() => onClick(tag)}
            className="group relative aspect-square rounded-2xl overflow-hidden bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 hover:border-violet-500/50 transition-all duration-500 transform hover:scale-[1.02]"
        >
            {loading ? (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
                </div>
            ) : previewUrl && !imgError ? (
                <img 
                    src={previewUrl} 
                    alt={tag} 
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    loading="lazy"
                    onError={() => setImgError(true)}
                    referrerPolicy="no-referrer"
                />
            ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10" />
            )}
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-4">
                <span className="text-white text-xs font-bold uppercase tracking-wider truncate group-hover:text-violet-300 transition-colors">
                    {tag.replace(/_/g, ' ')}
                </span>
            </div>
        </button>
    );
};

export const TagExplorerView: React.FC<TagExplorerViewProps> = ({ type, onTagClick, onNavigateHome }) => {
    const [currentLetter, setCurrentLetter] = useState('A');
    const [tags, setTags] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    const title = type.charAt(0).toUpperCase() + type.slice(1);

    useEffect(() => {
        const loadTags = async () => {
            setLoading(true);
            const results = await fetchExplorerTags(type, currentLetter);
            setTags(results || []);
            setLoading(false);
        };
        loadTags();
    }, [type, currentLetter]);

    return (
        <div className="w-full max-w-7xl mx-auto px-4 py-8 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                <div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-2 text-gray-900 dark:text-white">
                        Browse <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-fuchsia-500">{title}</span>
                    </h1>
                    <p className="text-gray-500 text-sm font-medium">Exploring categories alphabetically using global repository data.</p>
                </div>
                
                {/* Alphabet Bar */}
                <div className="flex flex-wrap gap-1 p-1 bg-black/5 dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/5 no-scrollbar max-w-full overflow-x-auto">
                    {ALPHABET.map(letter => (
                        <button
                            key={letter}
                            onClick={() => setCurrentLetter(letter)}
                            className={`w-8 h-8 flex items-center justify-center rounded-lg text-[10px] font-bold transition-all ${
                                currentLetter === letter 
                                ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/30 ring-2 ring-violet-500/20' 
                                : 'text-gray-500 hover:bg-black/5 dark:hover:bg-white/10'
                            }`}
                        >
                            {letter}
                        </button>
                    ))}
                </div>
            </div>

            {/* Results Grid */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-32 space-y-4">
                    <Spinner />
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest animate-pulse">Scanning Archive...</p>
                </div>
            ) : tags.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {tags.map((tag, idx) => (
                        <TagCard key={tag} tag={tag} index={idx} onClick={onTagClick} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-32 bg-black/5 dark:bg-white/5 rounded-3xl border border-dashed border-black/10 dark:border-white/10">
                    <p className="text-gray-500 text-sm italic">No {type} found starting with "{currentLetter}"</p>
                </div>
            )}
        </div>
    );
};
