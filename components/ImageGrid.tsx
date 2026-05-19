
import React, { forwardRef } from 'react';
import type { WaifuImage } from '../types';
import { ImageCard } from './ImageCard';

interface ImageGridProps {
    images: WaifuImage[];
    onImageClick: (image: WaifuImage, index?: number) => void;
}

export const ImageGrid = forwardRef<HTMLDivElement, ImageGridProps>(({ images, onImageClick }, ref) => {
    return (
        <div ref={ref} className="vault-gallery-grid">
            {images.map((image, index) => {
                return (
                    <div key={image.id} className="vault-gallery-item">
                        <ImageCard image={image} onClick={() => onImageClick(image, index)} isStandard={false} />
                    </div>
                );
            })}
        </div>
    );
});
