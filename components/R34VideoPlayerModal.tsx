import React, { useState, useEffect } from 'react';
import { r34videoService } from '../services/r34videoService';
import { R34VideoSearchResult, R34VideoDetails } from '../services/rule34video/types';
import { Spinner } from './Spinner';

interface R34VideoPlayerModalProps {
    videoInfo: R34VideoSearchResult;
    onClose: () => void;
}

const CloseIcon = () => (<svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>);

export const R34VideoPlayerModal: React.FC<R34VideoPlayerModalProps> = ({ videoInfo, onClose }) => {
    const [details, setDetails] = useState<R34VideoDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showDetails, setShowDetails] = useState(false);

    useEffect(() => {
        const fetchDetails = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await r34videoService.getVideoDetails(videoInfo.id);
                setDetails(data);
            } catch (err: any) {
                console.error("Failed to load video details", err);
                setError(err.message || 'Failed to load video details');
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [videoInfo.id]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    return (
        <div className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center animate-fade-in" onClick={onClose}>
            <div className="relative w-full h-full flex flex-col lg:flex-row" onClick={(e) => e.stopPropagation()}>
                
                {/* Video Area */}
                <div className="flex-1 flex items-center justify-center bg-black/20 overflow-hidden relative group min-h-0">
                    {loading && (
                        <div className="flex flex-col items-center">
                            <Spinner />
                            <p className="text-rose-400 mt-4 font-medium animate-pulse">Extracting Video Source...</p>
                        </div>
                    )}
                    
                    {error && (
                        <div className="text-red-400 text-center max-w-md p-6 bg-red-500/10 rounded-xl border border-red-500/30">
                            <p className="font-bold text-lg mb-2">Extraction Failed</p>
                            <p className="text-sm">{error}</p>
                        </div>
                    )}

                    {!loading && !error && details && details.mp4Url ? (
                        <video 
                            src={details.mp4Url}
                            controls
                            autoPlay
                            loop
                            playsInline
                            onClick={(e) => e.stopPropagation()}
                            className="max-w-full max-h-full object-contain transition-opacity duration-300 relative z-10"
                        />
                    ) : !loading && !error && details ? (
                        <div className="text-gray-400 text-center p-6">
                            <p className="mb-2">No compatible video source found.</p>
                            <a href={details.url} target="_blank" rel="noreferrer" className="text-rose-400 underline hover:text-rose-300 transition">
                                Watch on Rule34Video →
                            </a>
                        </div>
                    ) : null}

                    {/* Close button */}
                    <button onClick={onClose} className="absolute top-2 right-2 sm:top-4 sm:right-4 p-2 text-white/70 hover:text-white transition rounded-full bg-black/40 hover:bg-black/70 z-20">
                        <CloseIcon />
                    </button>

                    {/* Mobile: toggle details */}
                    <button 
                        onClick={() => setShowDetails(!showDetails)} 
                        className="lg:hidden absolute bottom-14 right-2 px-3 py-1.5 bg-black/60 text-white text-xs font-bold rounded-full z-20"
                    >
                        {showDetails ? 'Hide Info' : 'Show Info'}
                    </button>
                </div>
                
                {/* Details Panel — matches ImageModal style */}
                <div className={`w-full lg:w-80 xl:w-96 bg-white dark:bg-[#0f0f0f] border-t lg:border-t-0 lg:border-l border-black/5 dark:border-white/5 p-4 sm:p-6 flex flex-col overflow-y-auto no-scrollbar shadow-2xl text-gray-900 dark:text-gray-100 transition-all duration-300 ${showDetails ? 'max-h-[50vh] lg:max-h-full' : 'max-h-0 lg:max-h-full overflow-hidden lg:overflow-y-auto'}`}>
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Video Title</p>
                            <h2 className="text-lg sm:text-xl font-bold text-rose-400 leading-tight">{videoInfo.title}</h2>
                        </div>
                    </div>

                    {/* Video Info */}
                    <div className="space-y-2.5 sm:space-y-3 text-xs text-gray-500 border-t border-white/5 pt-4 sm:pt-6">
                        {videoInfo.duration && (
                            <div className="flex justify-between">
                                <span className="font-bold uppercase tracking-tighter">Duration</span>
                                <span className="text-gray-300">{videoInfo.duration}</span>
                            </div>
                        )}
                        {videoInfo.views && (
                            <div className="flex justify-between">
                                <span className="font-bold uppercase tracking-tighter">Views</span>
                                <span className="text-gray-300">{videoInfo.views}</span>
                            </div>
                        )}
                        {videoInfo.rating && (
                            <div className="flex justify-between">
                                <span className="font-bold uppercase tracking-tighter">Rating</span>
                                <span className="text-gray-300">{videoInfo.rating}</span>
                            </div>
                        )}
                        <div className="flex justify-between">
                            <span className="font-bold uppercase tracking-tighter">Source</span>
                            <span className="text-gray-300">Rule34Video</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-bold uppercase tracking-tighter">Type</span>
                            <span className="text-gray-300">Video</span>
                        </div>
                    </div>

                    {/* Tags */}
                    {details && details.tags && details.tags.length > 0 && (
                        <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-white/5">
                            <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Associated Tags</h3>
                            <div className="flex flex-wrap gap-1.5 sm:gap-2 max-h-36 sm:max-h-48 overflow-y-auto no-scrollbar">
                                {details.tags.map(tag => (
                                    <span key={tag.id} className="bg-white/5 border border-white/5 text-gray-400 text-[10px] px-2 sm:px-2.5 py-1 rounded-full hover:text-white transition cursor-default">
                                        #{tag.name}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* External Link */}
                    <div className="mt-auto pt-6">
                        <a 
                            href={videoInfo.url || `https://rule34video.com/video/${videoInfo.id}/`} 
                            target="_blank" 
                            rel="noreferrer"
                            className="block w-full text-center py-2.5 text-xs font-bold text-orange-400 bg-orange-500/10 border border-orange-500/20 rounded-xl hover:bg-orange-500/20 transition-all"
                        >
                            Open on Rule34Video →
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};
