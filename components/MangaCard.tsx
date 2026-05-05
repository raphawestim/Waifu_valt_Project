import React, { useState } from 'react';
import type { NHentaiGallery } from '../types';
import { nhentaiService } from '../services/nhentaiService';

interface MangaCardProps {
    gallery: NHentaiGallery;
    onClick: (gallery: NHentaiGallery) => void;
}

export const MangaCard: React.FC<MangaCardProps> = ({ gallery, onClick }) => {
    const [isHovered, setIsHovered] = useState(false);
    const coverUrl = nhentaiService.getCoverUrl(gallery);
    const title = gallery.title?.pretty || gallery.title?.english || gallery.title?.japanese || gallery.english_title || gallery.japanese_title || 'Unknown Title';
    
    // Find language tag (often 'english', 'japanese', 'chinese')
    let language = 'unknown';
    if (gallery.tags) {
        const languageTag = gallery.tags.find(t => t.type === 'language' && t.name !== 'translated');
        language = languageTag ? languageTag.name : 'unknown';
    } else if (gallery.tag_ids) {
        if (title.toLowerCase().includes('[chinese]') || title.toLowerCase().includes('chinese')) language = 'chinese';
        else if (title.toLowerCase().includes('[english]') || title.toLowerCase().includes('english')) language = 'english';
        else language = 'japanese';
    }

    return (
        <div 
            className="group relative w-full bg-neutral-200 dark:bg-[#111] rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:ring-2 hover:ring-rose-500/50 shadow-md dark:shadow-none flex flex-col"
            onClick={() => onClick(gallery)}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="relative aspect-[2/3] w-full">
                <img
                    src={coverUrl}
                    alt={title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                />
                
                {/* Badges */}
                <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-100 transition-opacity">
                    <span className="bg-black/80 backdrop-blur-md text-[10px] font-bold text-white px-1.5 py-0.5 rounded border border-white/10 uppercase">
                        {gallery.num_pages} Pages
                    </span>
                    <span className="bg-rose-600/90 backdrop-blur-md text-[10px] font-bold text-white px-1.5 py-0.5 rounded border border-white/10 uppercase text-center">
                        {language}
                    </span>
                </div>
            </div>

            <div className="p-3 bg-white dark:bg-[#1a1a1a] flex-1 flex flex-col justify-between">
                <h3 className="text-xs font-bold text-gray-900 dark:text-gray-100 line-clamp-2 leading-tight mb-2" title={title}>
                    {title}
                </h3>
                
                <div className="flex flex-wrap gap-1">
                    {(gallery.tags || []).filter(t => t.type === 'tag').slice(0, 3).map(tag => (
                        <span key={tag.id} className="text-[9px] px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-[#2a2a2a] text-gray-600 dark:text-gray-400">
                            {tag.name}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
};
