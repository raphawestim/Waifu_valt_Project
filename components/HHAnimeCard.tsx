import React from 'react';
import { HHAnime } from '../services/hentaihaven/types';

interface HHAnimeCardProps {
    anime: HHAnime;
    onClick: () => void;
}

export const HHAnimeCard: React.FC<HHAnimeCardProps> = ({ anime, onClick }) => {
    return (
        <div 
            onClick={onClick}
            className="group relative flex flex-col bg-neutral-900 rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.7)] border border-white/5 hover:border-indigo-500/50"
        >
            {/* Aspect ratio 2:3 for anime posters */}
            <div className="relative aspect-[2/3] w-full overflow-hidden bg-black/50">
                <img 
                    src={anime.coverImage || "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"} 
                    alt={anime.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    loading="lazy"
                />
                
                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />
                
                {/* Episodes Badge */}
                {anime.episodes && anime.episodes.length > 0 && (
                    <div className="absolute top-2 right-2 px-2 py-1 bg-indigo-600/90 backdrop-blur-md text-white text-[10px] font-black rounded-md shadow-lg border border-indigo-400/30 uppercase tracking-wider">
                        {anime.episodes[0].title}
                    </div>
                )}

                {/* Rating Stars */}
                <div className="absolute bottom-2 left-2 flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => (
                        <svg 
                            key={i}
                            className={`w-3 h-3 ${i < Math.floor(anime.rating) ? 'text-yellow-400 fill-current' : 'text-gray-600 fill-current'}`}
                            viewBox="0 0 20 20"
                        >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                    ))}
                </div>
            </div>

            {/* Info Area */}
            <div className="p-3 flex flex-col gap-1 bg-gradient-to-b from-neutral-900 to-neutral-950">
                <h3 className="text-white text-xs font-bold line-clamp-2 leading-snug group-hover:text-indigo-400 transition-colors h-8">
                    {anime.title}
                </h3>
            </div>
            
            {/* Hover Shine Effect */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-500 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transform" />
        </div>
    );
};
