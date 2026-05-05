import React, { useState, useEffect } from 'react';
import type { NHentaiGallery } from '../types';
import { nhentaiService } from '../services/nhentaiService';
import { Spinner } from './Spinner';

interface MangaReaderModalProps {
    gallery: NHentaiGallery;
    onClose: () => void;
}

const CloseIcon = () => (<svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>);

export const MangaReaderModal: React.FC<MangaReaderModalProps> = ({ gallery, onClose }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [loadingImage, setLoadingImage] = useState(true);
    const [fullGallery, setFullGallery] = useState<NHentaiGallery | null>(null);
    const [loadingGallery, setLoadingGallery] = useState(true);

    useEffect(() => {
        const fetchGallery = async () => {
            setLoadingGallery(true);
            try {
                const data = await nhentaiService.getGallery(gallery.id);
                setFullGallery(data);
            } catch (err) {
                console.error("Failed to load gallery details", err);
            }
            setLoadingGallery(false);
        };
        fetchGallery();
    }, [gallery.id]);

    const totalPages = fullGallery ? fullGallery.num_pages : gallery.num_pages;
    const currentImageUrl = fullGallery ? nhentaiService.getPageUrl(fullGallery, currentPage) : '';

    useEffect(() => {
        setLoadingImage(true);
    }, [currentPage, fullGallery]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight' && currentPage < totalPages) setCurrentPage(p => p + 1);
            if (e.key === 'ArrowLeft' && currentPage > 1) setCurrentPage(p => p - 1);
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentPage, totalPages, onClose]);

    const handleNext = () => {
        if (currentPage < totalPages) setCurrentPage(p => p + 1);
    };

    const handlePrev = () => {
        if (currentPage > 1) setCurrentPage(p => p - 1);
    };

    const displayTitle = fullGallery?.title?.pretty || fullGallery?.title?.english || gallery.english_title || gallery.japanese_title || 'Unknown Title';

    useEffect(() => {
        // Auto-scroll the active thumbnail into view
        const activeThumb = document.getElementById(`thumb-${currentPage}`);
        if (activeThumb) {
            activeThumb.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [currentPage]);

    return (
        <div className="fixed inset-0 bg-black/95 z-[100] flex animate-fade-in">
            {/* Main Content Area (Left side) */}
            <div className="flex-1 flex flex-col relative">
                {/* Header */}
                <div className="flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent absolute top-0 inset-x-0 z-20 pointer-events-none">
                    <div className="pointer-events-auto flex items-center gap-4">
                        <button onClick={onClose} className="p-2 text-white/70 hover:text-white transition rounded-full bg-black/40 hover:bg-black/70">
                            <CloseIcon />
                        </button>
                        <div>
                            <h2 className="text-white font-bold text-sm sm:text-base line-clamp-1">{displayTitle}</h2>
                            <p className="text-gray-400 text-xs">Page {currentPage} of {totalPages}</p>
                        </div>
                    </div>
                </div>

                {/* Reader Area */}
                <div className="flex-1 flex items-center justify-center bg-black overflow-hidden relative" onClick={handleNext}>
                    {(loadingGallery || loadingImage) && <Spinner />}
                    
                    {fullGallery && currentImageUrl && (
                        <img 
                            key={currentImageUrl}
                            src={currentImageUrl}
                            alt={`Page ${currentPage}`}
                            className={`max-w-full max-h-full object-contain transition-opacity duration-300 ${(loadingGallery || loadingImage) ? 'opacity-0' : 'opacity-100'}`}
                            onLoad={() => setLoadingImage(false)}
                            onError={() => setLoadingImage(false)}
                            referrerPolicy="no-referrer"
                        />
                    )}

                    {/* Navigation Overlay Areas */}
                    <div 
                        className="absolute inset-y-0 left-0 w-1/3 z-10 cursor-w-resize"
                        onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                    />
                </div>

                {/* Footer controls / Progress */}
                <div className="absolute bottom-4 inset-x-4 flex items-center justify-center z-20 pointer-events-none">
                    <div className="pointer-events-auto bg-black/60 backdrop-blur-md rounded-full px-4 py-2 flex items-center gap-4 border border-white/10">
                        <button 
                            onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                            disabled={currentPage <= 1}
                            className="text-white disabled:opacity-30 p-1 hover:text-rose-400 transition"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        
                        <span className="text-white text-sm font-bold w-16 text-center">
                            {currentPage} / {totalPages}
                        </span>

                        <button 
                            onClick={(e) => { e.stopPropagation(); handleNext(); }}
                            disabled={currentPage >= totalPages}
                            className="text-white disabled:opacity-30 p-1 hover:text-rose-400 transition"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Sidebar (Right side) */}
            <div 
                className="hidden sm:flex flex-col w-28 md:w-36 bg-black/90 border-l border-white/10 h-full overflow-y-auto py-4 px-2 gap-3 shadow-2xl z-30"
                style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.2) transparent' }}
            >
                {Array.from({ length: totalPages }).map((_, i) => {
                    const pageNum = i + 1;
                    const isCurrent = pageNum === currentPage;
                    const thumbUrl = fullGallery ? nhentaiService.getPageThumbnailUrl(fullGallery, pageNum) : '';
                    return (
                        <button 
                            key={pageNum}
                            id={`thumb-${pageNum}`}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`relative rounded-lg overflow-hidden border-2 transition-all duration-300 shrink-0 ${
                                isCurrent 
                                ? 'border-rose-500 ring-4 ring-rose-500/30 opacity-100 scale-105 z-10' 
                                : 'border-transparent opacity-40 hover:opacity-100 hover:border-white/30'
                            }`}
                            style={{ aspectRatio: '2/3' }}
                        >
                            {thumbUrl && (
                                <img 
                                    src={thumbUrl} 
                                    className="w-full h-full object-cover" 
                                    loading="lazy" 
                                    referrerPolicy="no-referrer"
                                    alt={`Thumbnail ${pageNum}`}
                                />
                            )}
                            <div className={`absolute bottom-0 inset-x-0 text-[11px] text-center font-bold py-1 backdrop-blur-md transition-colors ${isCurrent ? 'bg-rose-500/90 text-white' : 'bg-black/70 text-gray-300'}`}>
                                {pageNum}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
