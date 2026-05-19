
import React, { useState, useRef } from 'react';
import type { WaifuImage } from '../types';
import { useAI } from './AI/AIContext';
import { sendPromptToComfyUI } from '../services/comfyuiService';

interface ImageCardProps {
    image: WaifuImage;
    onClick: () => void;
    isStandard?: boolean;
}

const normalizeMediaUrl = (url: string): string => {
    if (!url) return '';
    if (url.startsWith('//')) return `https:${url}`;
    return url;
};

const getMotionPreviewUrl = (url: string): string => {
    const normalizedUrl = normalizeMediaUrl(url);
    if (!normalizedUrl || normalizedUrl.startsWith('/') || normalizedUrl.startsWith('blob:') || normalizedUrl.startsWith('data:')) {
        return normalizedUrl;
    }

    return `/api/proxy-image?url=${encodeURIComponent(normalizedUrl)}`;
};

const getCardAspectClass = (image: WaifuImage): string => {
    if (image.type === 'video') return 'aspect-video';
    if (image.type === 'gif') return image.width > image.height ? 'aspect-video' : 'aspect-[4/5]';
    if (!image.width || !image.height) return 'aspect-[3/4]';
    const ratio = image.width / image.height;
    if (ratio > 1.35) return 'aspect-video';
    if (ratio > 0.9) return 'aspect-square';
    if (ratio < 0.62) return 'aspect-[2/3]';
    return 'aspect-[3/4]';
};

const formatSourceLabel = (source: WaifuImage['sourceApi']): string => {
    if (source === 'waifu.im') return 'Waifu';
    if (source === 'rule34') return 'Rule34';
    return source.charAt(0).toUpperCase() + source.slice(1);
};

const getRatingBadgeClass = (rating: WaifuImage['rating']): string => {
    if (rating === 'explicit') return 'border-red-400/30 bg-red-500/20 text-red-100';
    if (rating === 'questionable') return 'border-pink-400/30 bg-pink-500/15 text-pink-100';
    return 'border-emerald-300/25 bg-emerald-400/10 text-emerald-100';
};

export const ImageCard: React.FC<ImageCardProps> = ({ image, onClick, isStandard = false }) => {
    const { setPromptLabImage, sendToVaultChat } = useAI();
    const [isHovered, setIsHovered] = useState(false);
    const [shouldPlay, setShouldPlay] = useState(false);
    const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isMotionMedia = image.type === 'video' || image.type === 'gif';
    const motionPreviewUrl = getMotionPreviewUrl(image.fullUrl);
    const imageWithDuration = image as WaifuImage & { duration?: string };
    const title = image.tags.slice(0, 3).join(' / ').replace(/_/g, ' ') || formatSourceLabel(image.sourceApi);
    const primaryTags = image.tags.filter(Boolean).slice(0, 5);
    const cardAspectClass = isStandard ? 'aspect-[2/3]' : getCardAspectClass(image);
    const openPromptLab = (e: React.MouseEvent) => {
        e.stopPropagation();
        setPromptLabImage({
            imageUrl: image.fullUrl,
            thumbnailUrl: image.thumbnailUrl,
            imageId: image.id,
            source: image.sourceApi,
            tags: image.tags,
        });
        window.dispatchEvent(new CustomEvent('wv:navigate', { detail: { view: 'prompt-lab' } }));
    };

    const sendImageToChat = (e: React.MouseEvent) => {
        e.stopPropagation();
        sendToVaultChat({
            image: {
                imageUrl: image.fullUrl,
                thumbnailUrl: image.thumbnailUrl,
                imageId: image.id,
                source: image.sourceApi,
                tags: image.tags,
            },
        });
    };

    const sendImagePromptToComfy = (e: React.MouseEvent) => {
        e.stopPropagation();
        sendPromptToComfyUI({
            positivePrompt: image.positivePrompt || image.tags.slice(0, 20).join(', '),
            negativePrompt: image.negativePrompt || '',
        }).then(() => {
            window.dispatchEvent(new CustomEvent('wv:navigate', { detail: { view: 'comfyui' } }));
        });
    };

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
            className="group relative w-full cursor-pointer overflow-hidden rounded-3xl border border-white/10 bg-[#0b0b12] shadow-2xl shadow-black/30 transition-all duration-500 hover:-translate-y-1 hover:border-violet-300/45 hover:shadow-violet-950/30"
            onClick={onClick}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <div className="pointer-events-none absolute inset-0 z-20 rounded-3xl ring-1 ring-inset ring-white/5" />
            <div className={`relative w-full overflow-hidden bg-gradient-to-br from-white/10 via-violet-500/10 to-cyan-500/10 ${cardAspectClass}`}>
                {shouldPlay ? (
                    <div className="w-full h-full animate-fade-in">
                        {image.type === 'video' ? (
                            <video 
                                src={motionPreviewUrl}
                                className="h-full w-full object-cover"
                                autoPlay
                                muted
                                loop
                                playsInline
                                preload="metadata"
                                referrerPolicy="no-referrer"
                            />
                        ) : (
                            <img src={motionPreviewUrl} className="h-full w-full object-cover" alt="animated" referrerPolicy="no-referrer" />
                        )}
                    </div>
                ) : (
                        <img
                            src={image.thumbnailUrl}
                            alt={image.tags[0]}
                            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                            loading="lazy"
                            referrerPolicy="no-referrer"
                        />
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-transparent opacity-60 transition-opacity duration-500 group-hover:opacity-95" />
                <div className="absolute inset-0 bg-violet-600/0 mix-blend-screen transition-colors duration-500 group-hover:bg-violet-600/10" />

                <div className="absolute left-3 top-3 z-30 flex flex-wrap gap-1.5">
                    <span className="rounded-full border border-white/15 bg-black/55 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-white/90 backdrop-blur-md">
                        {formatSourceLabel(image.sourceApi)}
                    </span>
                    {image.rating !== 'safe' && (
                        <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] backdrop-blur-md ${getRatingBadgeClass(image.rating)}`}>
                            NSFW
                        </span>
                    )}
                </div>

                <div className="absolute right-3 top-3 z-30 flex flex-col items-end gap-1.5">
                    {isMotionMedia && (
                        <span className="rounded-full border border-white/15 bg-black/65 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-white backdrop-blur-md">
                            {imageWithDuration.duration || image.type}
                        </span>
                    )}
                    <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] backdrop-blur-md ${getRatingBadgeClass(image.rating)}`}>
                        {image.rating}
                    </span>
                </div>

                <div className="absolute inset-x-0 bottom-0 z-30 p-4">
                    <div className="translate-y-3 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-white/15 text-white shadow-2xl shadow-black/40 backdrop-blur-md">
                            <svg className="ml-0.5 h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className={`absolute inset-x-0 bottom-0 z-40 p-3 transition-all duration-500 sm:p-4 ${isHovered ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'}`}>
                    <div className="mb-2 min-w-0">
                        <h3 className="line-clamp-2 text-sm font-black leading-tight text-white drop-shadow-lg">
                            {title}
                        </h3>
                        <div className="mt-1 flex items-center gap-2 text-[11px] font-semibold text-gray-300">
                            <span className="truncate">{image.artist || 'Unknown Artist'}</span>
                            <span className="text-gray-600">•</span>
                            <span>{image.score || 0} rating</span>
                        </div>
                    </div>
                    <div className="mb-3 flex flex-wrap gap-1.5">
                        {primaryTags.map(tag => (
                            <span key={tag} className="max-w-[120px] truncate rounded-full border border-white/10 bg-white/10 px-2 py-0.5 text-[10px] font-bold text-gray-200 backdrop-blur-md">
                                #{tag.replace(/_/g, ' ')}
                            </span>
                        ))}
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                        <button onClick={openPromptLab} className="rounded-xl bg-violet-600/95 px-2 py-2 text-[10px] font-black text-white shadow-lg shadow-violet-950/30 transition hover:bg-violet-500">Generate Prompt</button>
                        <button onClick={sendImageToChat} className="rounded-xl bg-cyan-500/90 px-2 py-2 text-[10px] font-black text-white shadow-lg shadow-cyan-950/20 transition hover:bg-cyan-400">Vault Chat</button>
                        <button onClick={openPromptLab} className="rounded-xl border border-white/10 bg-white/10 px-2 py-2 text-[10px] font-black text-white backdrop-blur-md transition hover:bg-white/20">Analyze AI</button>
                        <button onClick={sendImagePromptToComfy} className="rounded-xl bg-emerald-500/90 px-2 py-2 text-[10px] font-black text-white shadow-lg shadow-emerald-950/20 transition hover:bg-emerald-400">ComfyUI</button>
                    </div>
                </div>
            </div>

            <div className="space-y-2 p-3 sm:p-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <h3 className="truncate text-sm font-black text-white">{title}</h3>
                        <p className="mt-1 truncate text-[11px] font-medium text-gray-500">{image.width}x{image.height} • {formatSourceLabel(image.sourceApi)}</p>
                    </div>
                    <span className="shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[10px] font-black text-gray-300">
                        {image.score || 0}
                    </span>
                </div>
            </div>
        </div>
    );
};
