
import React, { useState, useRef } from 'react';
import type { WaifuImage } from '../types';

interface ImageCardProps {
    image: WaifuImage;
    onClick: () => void;
    isStandard?: boolean;
}

export const ImageCard: React.FC<ImageCardProps> = ({ image, onClick, isStandard = false }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [shouldPlay, setShouldPlay] = useState(false);
    const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isMotionMedia = image.type === 'video' || image.type === 'gif';

    const handleMouseEnter = () => {
        setIsHovered(true);
        if (isMotionMedia) {
            hoverTimeoutRef.current = setTimeout(() => {
                setShouldPlay(true);
            }, 400);
        }
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
        setShouldPlay(false);
        if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };

    return (
        <div 
            className="group relative w-full bg-neutral-200 dark:bg-[#111] rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:ring-2 hover:ring-violet-500/50 shadow-md dark:shadow-none"
            onClick={() => onClick(image)}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {/* Media Container */}
            <div className={`relative w-full ${isStandard ? 'aspect-[2/3]' : 'aspect-auto'}`}>
                {shouldPlay ? (
                    <div className="w-full h-full animate-fade-in">
                        {image.type === 'video' ? (
                            <video 
                                src={image.fullUrl}
                                className="w-full h-auto object-cover"
                                autoPlay
                                muted
                                loop
                                playsInline
                                referrerPolicy="no-referrer"
                            />
                        ) : (
                            <img src={image.fullUrl} className="w-full h-auto object-cover" alt="animated" referrerPolicy="no-referrer" />
                        )}
                    </div>
                ) : (
                        <img
                            src={image.thumbnailUrl}
                            alt={image.tags[0]}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            loading="lazy"
                            referrerPolicy="no-referrer"
                        />
                )}

                {/* Badges */}
                <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {isMotionMedia && (
                        <span className="bg-black/60 backdrop-blur-md text-[9px] font-bold text-white px-1.5 py-0.5 rounded border border-white/10 uppercase">
                            {image.type}
                        </span>
                    )}
                    <span className="bg-violet-600/80 backdrop-blur-md text-[9px] font-bold text-white px-1.5 py-0.5 rounded border border-white/10 uppercase">
                        {image.sourceApi.replace('.im', '')}
                    </span>
                </div>
            </div>

            {/* Subtle Overlay Info */}
            <div className={`absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black via-black/80 to-transparent transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
                <div className="flex flex-wrap gap-1 mb-1">
                    {image.tags.slice(0, 2).map(tag => (
                        <span key={tag} className="text-[10px] text-gray-300 truncate">#{tag.replace(/_/g, '')}</span>
                    ))}
                </div>
                <div className="text-[10px] font-bold text-violet-400 truncate">
                    {image.artist || 'Unknown Artist'}
                </div>
            </div>
        </div>
    );
};
