
import React, { useState, useEffect } from 'react';
import type { WaifuImage } from '../types';

interface HeroCarouselProps {
    images: WaifuImage[];
    onExploreClick: () => void;
    onPlayClick: (image: WaifuImage) => void;
}

const InfoIcon = () => (
    <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
);

const PlayIcon = () => (
    <svg className="w-6 h-6 mr-2 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"></path></svg>
);

export const HeroCarousel: React.FC<HeroCarouselProps> = ({ images, onExploreClick, onPlayClick }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);

    useEffect(() => {
        if (images.length <= 1) return;

        const interval = setInterval(() => {
            setIsTransitioning(true);
            setTimeout(() => {
                setCurrentIndex((prev) => (prev + 1) % images.length);
                setIsTransitioning(false);
            }, 500); // Wait for fade out
        }, 8000); // Rotate every 8 seconds

        return () => clearInterval(interval);
    }, [images]);

    if (!images || images.length === 0) return null;

    const currentImage = images[currentIndex];

    return (
        <section className="relative h-[92vh] min-h-[620px] w-full overflow-hidden bg-[#05050a]">
            {/* Background Image/Video with Fade Transition */}
            <div className={`absolute top-0 left-0 w-full h-full transition-opacity duration-1000 ease-in-out ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
                {currentImage.type === 'video' ? (
                    <video
                        src={currentImage.fullUrl}
                        className="w-full h-full object-cover"
                        autoPlay
                        muted
                        loop
                        playsInline
                        preload="metadata"
                        poster={currentImage.thumbnailUrl}
                        referrerPolicy="no-referrer"
                    />
                ) : (
                        <img
                            src={currentImage.thumbnailUrl || currentImage.fullUrl}
                            alt="Featured"
                            className="w-full h-full object-cover object-center scale-105"
                            loading="eager"
                            decoding="async"
                            fetchPriority="high"
                            referrerPolicy="no-referrer"
                        />
                )}
                
                <div className="absolute inset-0 bg-gradient-to-r from-[#05050a] via-[#05050a]/55 to-transparent"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-[#05050a] via-[#05050a]/35 to-transparent"></div>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_48%,rgba(124,58,237,0.22),transparent_34%),radial-gradient(circle_at_75%_25%,rgba(14,165,233,0.12),transparent_30%)]"></div>
            </div>

            {/* Content Overlay */}
            <div className="absolute top-0 left-0 w-full h-full flex items-center">
                <div className={`px-5 md:px-12 w-full max-w-3xl pt-20 transition-all duration-1000 transform ${isTransitioning ? 'translate-y-4 opacity-0' : 'translate-y-0 opacity-100'}`}>
                    <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-950/30 px-3 py-1 text-[11px] font-black uppercase tracking-[0.22em] text-violet-200 shadow-[0_0_28px_rgba(139,92,246,0.2)] backdrop-blur-xl">
                        Premium local vault
                        <span className="h-1 w-1 rounded-full bg-red-400" />
                        NSFW curated
                    </div>
                    <h1 className="text-5xl md:text-8xl font-black text-white mb-5 drop-shadow-2xl uppercase tracking-tight leading-[0.88]">
                        {currentImage.tags[0]?.replace(/_/g, ' ') || "Waifu Vault"}
                    </h1>
                    
                    <div className="flex flex-wrap items-center gap-2 mb-5 text-sm md:text-base">
                        <span className="rounded-full bg-emerald-500/10 px-3 py-1 font-bold text-emerald-300">98% Match</span>
                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-gray-300">2026</span>
                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-gray-300">HD</span>
                        <span className="rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-violet-200 capitalize">{currentImage.sourceApi}</span>
                    </div>

                    <p className="text-gray-100 text-base md:text-xl drop-shadow-md mb-8 line-clamp-3 max-w-2xl leading-relaxed">
                         Explore a cinematic stream of {currentImage.tags.slice(0, 3).map(tag => tag.replace(/_/g, ' ')).join(', ')}.
                         Curated from <span className="text-violet-300">{currentImage.sourceApi}</span> with premium dark-mode browsing.
                    </p>
                    
                    <div className="flex flex-wrap gap-3">
                        <button 
                            onClick={() => onPlayClick(currentImage)}
                            className="flex items-center justify-center rounded-xl bg-white px-6 py-3 text-base font-black text-black shadow-2xl shadow-white/10 transition hover:scale-[1.02] hover:bg-violet-100 md:px-8"
                        >
                            <PlayIcon /> {currentImage.type === 'video' ? 'Play' : 'View'}
                        </button>
                        <button 
                            onClick={onExploreClick}
                            className="flex items-center justify-center rounded-xl border border-white/15 bg-white/10 px-6 py-3 text-base font-black text-white shadow-2xl shadow-black/30 backdrop-blur-xl transition hover:bg-white/15 md:px-8"
                        >
                            <InfoIcon /> Explore APIs
                        </button>
                    </div>
                </div>
            </div>

            {/* Carousel Indicators */}
            <div className="absolute right-4 md:right-12 bottom-32 md:bottom-40 flex space-x-2">
                {images.map((_, idx) => (
                    <div 
                        key={idx} 
                        className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentIndex ? 'w-8 bg-violet-300' : 'w-2 bg-gray-500/50'}`}
                    />
                ))}
            </div>
        </section>
    );
};
