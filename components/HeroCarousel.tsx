
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
        <div className="relative h-[56.25vw] max-h-[85vh] w-full overflow-hidden bg-[#141414]">
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
                        poster={currentImage.thumbnailUrl}
                    />
                ) : (
                    <img
                        src={currentImage.fullUrl}
                        alt="Featured"
                        className="w-full h-full object-cover object-top"
                    />
                )}
                
                <div className="absolute inset-0 bg-gradient-to-r from-[#141414] via-transparent to-transparent"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/20 to-transparent"></div>
            </div>

            {/* Content Overlay */}
            <div className="absolute top-0 left-0 w-full h-full flex items-center">
                <div className={`px-4 md:px-12 w-full md:w-1/2 pt-16 transition-all duration-1000 transform ${isTransitioning ? 'translate-y-4 opacity-0' : 'translate-y-0 opacity-100'}`}>
                    <h1 className="text-4xl md:text-7xl font-black text-white mb-4 drop-shadow-lg uppercase tracking-wide leading-none">
                        {currentImage.tags[0] || "Waifu Vault"}
                    </h1>
                    
                    <div className="flex items-center space-x-2 mb-4 text-green-400 font-bold text-sm md:text-base">
                        <span>98% Match</span>
                        <span className="text-gray-400 font-normal">2024</span>
                        <span className="border border-gray-500 text-gray-400 px-1 text-xs">HD</span>
                        <span className="text-gray-400 capitalize text-xs border border-gray-600 px-1 rounded">{currentImage.sourceApi}</span>
                    </div>

                    <p className="text-white text-lg md:text-xl drop-shadow-md mb-8 line-clamp-3 text-shadow-lg max-w-2xl">
                         Explore this stunning artwork featuring {currentImage.tags.slice(0, 3).join(', ')}. 
                         Artist: <span className="text-violet-400">{currentImage.artist || 'Unknown'}</span>.
                         Dive into a world of curated anime aesthetics.
                    </p>
                    
                    <div className="flex space-x-4">
                        <button 
                            onClick={() => onPlayClick(currentImage)}
                            className="flex items-center justify-center px-6 md:px-8 py-2 md:py-3 bg-white text-black rounded font-bold text-lg hover:bg-opacity-80 transition shadow-lg"
                        >
                            <PlayIcon /> {currentImage.type === 'video' ? 'Play' : 'View'}
                        </button>
                        <button 
                            onClick={onExploreClick}
                            className="flex items-center justify-center px-6 md:px-8 py-2 md:py-3 bg-gray-500/70 text-white rounded font-bold text-lg hover:bg-gray-500/50 transition backdrop-blur-sm"
                        >
                            <InfoIcon /> More Info
                        </button>
                    </div>
                </div>
            </div>

            {/* Carousel Indicators */}
            <div className="absolute right-4 md:right-12 bottom-32 md:bottom-48 flex space-x-2">
                {images.map((_, idx) => (
                    <div 
                        key={idx} 
                        className={`w-2 h-2 md:w-3 md:h-3 rounded-full transition-all duration-300 ${idx === currentIndex ? 'bg-white scale-125' : 'bg-gray-500/50'}`}
                    />
                ))}
            </div>
        </div>
    );
};
