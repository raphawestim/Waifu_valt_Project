import React from 'react';
import type { R34VideoSearchResult } from '../services/rule34video/types';

interface R34VideoCardProps {
    video: R34VideoSearchResult;
    onClick: () => void;
}

export const R34VideoCard: React.FC<R34VideoCardProps> = ({ video, onClick }) => {
    return (
        <div 
            onClick={onClick}
            className="group relative flex flex-col bg-neutral-900 rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.5)] border border-white/5 hover:border-rose-500/50"
        >
            {/* Thumbnail Area */}
            <div className="relative aspect-[2/3] w-full overflow-hidden bg-black/50">
                <img 
                    src={video.thumbnail || "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"} 
                    alt={video.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />
                
                {/* Duration Badge */}
                {video.duration && (
                    <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/70 backdrop-blur-sm text-white text-xs font-bold rounded">
                        {video.duration}
                    </div>
                )}
                
                {/* Rating Badge */}
                {video.rating && (
                    <div className="absolute top-2 left-2 px-2 py-0.5 bg-rose-500/80 backdrop-blur-sm text-white text-xs font-bold rounded flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" /></svg>
                        {video.rating}
                    </div>
                )}
            </div>

            {/* Info Area */}
            <div className="p-3 flex flex-col gap-1">
                <h3 className="text-white text-sm font-semibold line-clamp-2 leading-tight group-hover:text-rose-400 transition-colors">
                    {video.title}
                </h3>
                
                {video.views && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        <span>{video.views}</span>
                    </div>
                )}
            </div>
        </div>
    );
};
