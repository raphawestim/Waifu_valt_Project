
import React, { forwardRef } from 'react';
import type { WaifuImage } from '../types';
import { ImageCard } from './ImageCard';

interface ImageGridProps {
    images: WaifuImage[];
    onImageClick: (image: WaifuImage, index?: number) => void;
}

export const ImageGrid = forwardRef<HTMLDivElement, ImageGridProps>(({ images, onImageClick }, ref) => {
    return (
        <div className="masonry-grid">
            {images.map((image, index) => {
                return (
                    <div key={image.id} className="masonry-item">
                        <ImageCard image={image} onClick={() => onImageClick(image, index)} />
                    </div>
                );
            })}
        </div>
    );
});