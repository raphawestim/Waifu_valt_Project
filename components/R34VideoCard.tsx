import React, { useEffect, useMemo, useState } from 'react';
import type { R34VideoSearchResult } from '../services/rule34video/types';

interface R34VideoCardProps {
    video: R34VideoSearchResult;
    onClick: () => void;
}

const TRANSPARENT_PIXEL = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

const normalizeThumbnailUrl = (url: string): string => {
    if (!url) return '';
    if (url.startsWith('//')) return `https:${url}`;
    if (url.startsWith('/')) return `https://rule34video.com${url}`;
    return url;
};

const proxiedThumbnailUrl = (url: string): string => {
    const normalizedUrl = normalizeThumbnailUrl(url);
    if (!normalizedUrl || normalizedUrl.startsWith('data:')) return normalizedUrl || TRANSPARENT_PIXEL;
    return `/api/proxy-image?url=${encodeURIComponent(normalizedUrl)}`;
};

const buildThumbnailCandidates = (thumbnail: string): string[] => {
    const normalizedUrl = normalizeThumbnailUrl(thumbnail);
    if (!normalizedUrl || normalizedUrl.startsWith('data:')) return [TRANSPARENT_PIXEL];

    const candidates = [normalizedUrl];
    const frameMatch = normalizedUrl.match(/\/320x180\/([0-9]+)\.(jpg|jpeg|png|webp)(\?.*)?$/i);

    if (frameMatch) {
        const extension = frameMatch[2];
        const query = frameMatch[3] || '';
        for (const frame of ['1', '2', '3']) {
            candidates.push(normalizedUrl.replace(/\/320x180\/[0-9]+\.(jpg|jpeg|png|webp)(\?.*)?$/i, `/320x180/${frame}.${extension}${query}`));
        }
    }

    return Array.from(new Set(candidates)).map(proxiedThumbnailUrl);
};

export const R34VideoCard: React.FC<R34VideoCardProps> = ({ video, onClick }) => {
    const thumbnailCandidates = useMemo(() => buildThumbnailCandidates(video.thumbnail), [video.thumbnail]);
    const [thumbnailIndex, setThumbnailIndex] = useState(0);
    const [thumbnailFailed, setThumbnailFailed] = useState(false);
    const thumbnailSrc = thumbnailFailed ? TRANSPARENT_PIXEL : thumbnailCandidates[thumbnailIndex] || TRANSPARENT_PIXEL;

    useEffect(() => {
        setThumbnailIndex(0);
        setThumbnailFailed(false);
    }, [video.thumbnail]);

    const handleThumbnailError = () => {
        if (thumbnailIndex < thumbnailCandidates.length - 1) {
            setThumbnailIndex(index => index + 1);
            return;
        }

        setThumbnailFailed(true);
    };

    return (
        <div 
            onClick={onClick}
            className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0d0f18]/90 cursor-pointer shadow-xl shadow-black/30 transition-all duration-300 hover:-translate-y-1 hover:border-violet-400/50 hover:shadow-[0_18px_60px_rgba(124,58,237,0.22)]"
        >
            {/* Thumbnail Area */}
            <div className="relative aspect-video w-full overflow-hidden bg-black/60">
                <img 
                    src={thumbnailSrc} 
                    alt={video.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    loading="lazy"
                    decoding="async"
                    onError={handleThumbnailError}
                />
                {thumbnailFailed && (
                    <div className="absolute inset-0 flex items-center justify-center bg-neutral-950 text-rose-300/70">
                        <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 10l4.55-2.28A1 1 0 0121 8.62v6.76a1 1 0 01-1.45.9L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent opacity-75 transition-opacity group-hover:opacity-90" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-all duration-300 group-hover:opacity-100">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/30 bg-white/15 text-white shadow-2xl backdrop-blur-xl transition-transform duration-300 group-hover:scale-105">
                        <svg className="ml-1 h-7 w-7 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                    </div>
                </div>
                
                {/* Duration Badge */}
                {video.duration && (
                    <div className="absolute bottom-2 right-2 rounded-md bg-black/80 px-2 py-1 text-xs font-black text-white shadow-lg backdrop-blur-md">
                        {video.duration}
                    </div>
                )}
                
                {/* Rating Badge */}
                {video.rating && (
                    <div className="absolute top-2 left-2 flex items-center gap-1 rounded-md border border-red-300/20 bg-red-950/70 px-2 py-1 text-xs font-black text-red-100 backdrop-blur-md">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" /></svg>
                        {video.rating}
                    </div>
                )}
            </div>

            {/* Info Area */}
            <div className="flex flex-1 flex-col gap-2 p-3.5">
                <h3 className="line-clamp-2 text-sm font-bold leading-tight text-white transition-colors group-hover:text-violet-200">
                    {video.title}
                </h3>
                
                <div className="mt-auto flex items-center justify-between gap-3 text-xs text-gray-400">
                    {video.views ? (
                        <div className="flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                            <span>{video.views}</span>
                        </div>
                    ) : <span>Rule34Video</span>}
                    {video.rating && <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-bold text-red-300">{video.rating}</span>}
                </div>
            </div>
        </div>
    );
};
