
import React from 'react';
import type { WaifuImage } from '../types';
import { ImageCard } from './ImageCard';

interface FeaturedCarouselProps {
    images: WaifuImage[];
    title: string;
    onImageClick: (image: WaifuImage) => void;
}

export const FeaturedCarousel: React.FC<FeaturedCarouselProps> = ({ images, title, onImageClick }) => {
    if (!images || images.length === 0) return null;

    // Duplicate images for a seamless loop effect
    const duplicatedImages = [...images, ...images];

    return (
        <div className="py-8 md:py-12">
            <h2 className="text-2xl font-bold mb-6 text-white px-4 md:px-8">{title}</h2>
            <div className="relative w-full overflow-hidden group [mask-image:_linear-gradient(to_right,transparent_0,_black_128px,_black_calc(100%-128px),transparent_100%)]">
                <div className="flex animate-scroll group-hover:[animation-play-state:paused]">
                    {duplicatedImages.map((image, index) => (
                        <div key={`${image.id}-${index}`} className="flex-shrink-0 w-64 md:w-72 mx-3">
                            <ImageCard image={image} onClick={() => onImageClick(image)} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
