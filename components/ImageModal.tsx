
import React, { useState, useEffect, useRef } from 'react';
import type { WaifuImage } from '../types';
import { useAuth } from '../context/AuthContext';
import { Spinner } from './Spinner';
import { useAI } from './AI/AIContext';
import { sendPromptToComfyUI } from '../services/comfyuiService';

const CloseIcon = () => (<svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>);
const DownloadIcon = () => (<svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>);
const HeartIcon = ({ filled }: { filled: boolean }) => (<svg className={`w-5 h-5 sm:w-6 sm:h-6 transition-colors ${filled ? 'text-red-500 fill-current' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z"></path></svg>);
const PlusIcon = () => (<svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>);

interface ImageModalProps {
    image: WaifuImage;
    onClose: () => void;
    isLoggedIn: boolean;
    onAuthRequest: () => void;
    onNext: () => void;
    onPrev: () => void;
    canNext: boolean;
    canPrev: boolean;
}

const ArrowButton: React.FC<{ direction: 'left' | 'right', onClick: () => void, disabled: boolean }> = ({ direction, onClick, disabled }) => (
    <button
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        disabled={disabled}
        className={`p-1.5 sm:p-2 rounded-full bg-black/40 text-white hover:bg-black/70 transition-all disabled:opacity-0 disabled:pointer-events-none mx-1 sm:mx-2`}
    >
        <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {direction === 'left' ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            )}
        </svg>
    </button>
);

const normalizeMediaUrl = (url: string): string => {
    if (!url) return '';
    if (url.startsWith('//')) return `https:${url}`;
    return url;
};

const isLocalMediaUrl = (url: string): boolean => (
    url.startsWith('/') ||
    url.startsWith('blob:') ||
    url.startsWith('data:')
);

/** Build a working media URL through the local Vite proxy when hotlinking fails. */
const getProxiedUrl = (url: string): string => {
    const normalizedUrl = normalizeMediaUrl(url);
    if (!normalizedUrl) return '';
    if (isLocalMediaUrl(normalizedUrl)) return normalizedUrl;
    return `/api/proxy-image?url=${encodeURIComponent(normalizedUrl)}`;
};

const shouldUseProxyFirst = (image: WaifuImage): boolean => {
    const directUrl = normalizeMediaUrl(image.fullUrl);
    if (!directUrl || isLocalMediaUrl(directUrl)) return false;
    return image.type === 'video' || image.type === 'gif';
};

const getInitialProxyState = (image: WaifuImage): 'none' | 'internal' => (
    shouldUseProxyFirst(image) ? 'internal' : 'none'
);

const getMediaSrc = (url: string, proxyState: 'none' | 'internal'): string => {
    const normalizedUrl = normalizeMediaUrl(url);
    if (!normalizedUrl) return '';
    if (proxyState === 'internal') return getProxiedUrl(normalizedUrl);
    return normalizedUrl;
};

const getFileNameFromUrl = (url: string): string => {
    try {
        const parsed = new URL(normalizeMediaUrl(url));
        return parsed.pathname.split('/').pop() || 'waifu';
    } catch {
        return url.split('/').pop() || 'waifu';
    }
};

const getMediaLabel = (image: WaifuImage): string => {
    if (image.type === 'video') return 'video';
    if (image.type === 'gif') return 'GIF';
    return 'image';
};

export const ImageModal: React.FC<ImageModalProps> = ({ image, onClose, isLoggedIn, onAuthRequest, onNext, onPrev, canNext, canPrev }) => {
    const { addFavorite, removeFavorite, isFavorite, lists, createList, addImageToList } = useAuth();
    const { setPromptLabImage, sendToVaultChat } = useAI();
    const [isFavorited, setIsFavorited] = useState(false);
    const [showListMenu, setShowListMenu] = useState(false);
    const [newListName, setNewListName] = useState('');
    const [loading, setLoading] = useState(true);
    const [proxyState, setProxyState] = useState<'none' | 'internal'>(() => getInitialProxyState(image));
    const [loadFailed, setLoadFailed] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [zoom, setZoom] = useState(1);

    // Determine current src
    const directUrl = normalizeMediaUrl(image.fullUrl);
    const currentSrc = getMediaSrc(directUrl, proxyState);

    useEffect(() => {
        setIsFavorited(isFavorite(image.id));
        setLoading(true);
        setLoadFailed(false);
        setProxyState(getInitialProxyState(image));
        setShowDetails(false);
    }, [image, isFavorite]);

    // Keyboard navigation — skip arrow capture when a video is focused (so seeking works)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const active = document.activeElement;
            const isVideoFocused = active instanceof HTMLVideoElement;
            if (e.key === 'ArrowRight' && canNext && !isVideoFocused) onNext();
            if (e.key === 'ArrowLeft' && canPrev && !isVideoFocused) onPrev();
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [canNext, canPrev, onNext, onPrev, onClose]);

    const handleFavoriteClick = () => {
        if (!isLoggedIn) { onAuthRequest(); return; }
        if (isFavorited) removeFavorite(image.id);
        else addFavorite(image);
        setIsFavorited(!isFavorited);
    };
    
    const handleAddToList = (listName: string) => {
        if (!isLoggedIn) { onAuthRequest(); return; }
        addImageToList(listName, image);
        setShowListMenu(false);
    };

    const handleCreateList = () => {
        if (newListName.trim() && !lists.some(l => l.name === newListName.trim())) {
            createList(newListName.trim());
            addImageToList(newListName.trim(), image);
            setNewListName('');
            setShowListMenu(false);
        }
    };

    const handleDownload = () => {
        // Use proxy for downloads to bypass CORS
        const downloadUrl = getProxiedUrl(image.fullUrl);
        fetch(downloadUrl)
            .then(res => res.blob())
            .then(blob => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                const fileName = getFileNameFromUrl(image.fullUrl);
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            })
            .catch(err => console.error('Error downloading image:', err));
    };

    const openInPromptLab = () => {
        setPromptLabImage({
            imageUrl: image.fullUrl,
            thumbnailUrl: image.thumbnailUrl,
            imageId: image.id,
            source: image.sourceApi,
            tags: image.tags,
        });
        window.dispatchEvent(new CustomEvent('wv:navigate', { detail: { view: 'prompt-lab' } }));
        onClose();
    };

    const sendToChat = () => {
        sendToVaultChat({
            image: {
                imageUrl: image.fullUrl,
                thumbnailUrl: image.thumbnailUrl,
                imageId: image.id,
                source: image.sourceApi,
                tags: image.tags,
            },
            text: image.positivePrompt,
        });
    };

    const sendImageToComfy = () => {
        sendPromptToComfyUI({
            positivePrompt: image.positivePrompt || image.tags.slice(0, 30).join(', '),
            negativePrompt: image.negativePrompt || '',
        }).then(() => {
            window.dispatchEvent(new CustomEvent('wv:navigate', { detail: { view: 'comfyui' } }));
            onClose();
        });
    };

    const handleMediaError = () => {
        if (proxyState === 'none') {
            setProxyState('internal');
            return;
        }

        setLoading(false);
        setLoadFailed(true);
    };

    return (
        <div className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center animate-fade-in" onClick={onClose}>
            <div className="relative w-full h-full flex flex-col lg:flex-row" onClick={(e) => e.stopPropagation()}>
                
                {/* Media Area */}
                <div className="flex-1 flex items-center justify-center bg-black/20 overflow-hidden relative group min-h-0">
                    {loading && <Spinner />}
                    {image.type === 'video' ? (
                        <video
                            key={`${image.id}-${proxyState}`}
                            src={currentSrc}
                            controls
                            autoPlay
                            loop
                            muted
                            playsInline
                            preload="metadata"
                            onLoadedData={() => setLoading(false)}
                            onCanPlay={() => setLoading(false)}
                            onError={handleMediaError}
                            referrerPolicy="no-referrer"
                            onClick={(e) => e.stopPropagation()}
                            className={`max-w-full max-h-full object-contain transition-opacity duration-300 relative z-10 ${loading ? 'opacity-0' : 'opacity-100'}`}
                        >
                            Your browser does not support the video tag.
                        </video>
                    ) : (
                        <img 
                            key={`${image.id}-${proxyState}`}
                            src={currentSrc} 
                            alt={image.tags.slice(0, 5).join(', ')} 
                            className={`max-w-full max-h-full object-contain transition-opacity duration-300 ${loading ? 'opacity-0' : 'opacity-100'}`}
                            onLoad={() => setLoading(false)}
                            onError={handleMediaError}
                            referrerPolicy="no-referrer"
                        />
                    )}
                    {loadFailed && (
                        <div className="absolute inset-0 z-20 flex items-center justify-center p-6 text-center">
                            <div className="max-w-md rounded-xl border border-white/10 bg-black/80 p-5 text-white shadow-2xl">
                                <p className="text-sm font-bold">Could not load this {getMediaLabel(image)}.</p>
                                <a
                                    href={directUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="mt-3 inline-flex text-xs font-semibold text-violet-300 hover:text-violet-200"
                                >
                                    Open original source
                                </a>
                            </div>
                        </div>
                    )}

                    {/* Navigation Arrows — pointer-events-none on wrapper so they don't block video controls */}
                    <div className="absolute inset-y-0 left-0 w-16 sm:w-20 flex items-center justify-start pointer-events-none z-20">
                        <div className="pointer-events-auto">
                            <ArrowButton direction="left" onClick={onPrev} disabled={!canPrev} />
                        </div>
                    </div>
                    <div className="absolute inset-y-0 right-0 w-16 sm:w-20 flex items-center justify-end pointer-events-none z-20">
                        <div className="pointer-events-auto">
                            <ArrowButton direction="right" onClick={onNext} disabled={!canNext} />
                        </div>
                    </div>

                    {/* Close button (always visible on mobile) */}
                    <button onClick={onClose} className="absolute top-2 right-2 sm:top-4 sm:right-4 p-2 text-white/70 hover:text-white transition rounded-full bg-black/40 hover:bg-black/70 z-20">
                        <CloseIcon />
                    </button>

                    {/* Mobile: toggle details button — placed higher to avoid covering video controls */}
                    <button 
                        onClick={() => setShowDetails(!showDetails)} 
                        className="lg:hidden absolute bottom-14 right-2 px-3 py-1.5 bg-black/60 text-white text-xs font-bold rounded-full z-20"
                    >
                        {showDetails ? 'Hide Info' : 'Show Info'}
                    </button>
                </div>
                
                {/* Details Panel — always visible on desktop, toggle on mobile */}
                <div className={`w-full lg:w-80 xl:w-96 bg-white dark:bg-[#0f0f0f] border-t lg:border-t-0 lg:border-l border-black/5 dark:border-white/5 p-4 sm:p-6 flex flex-col overflow-y-auto no-scrollbar shadow-2xl text-gray-900 dark:text-gray-100 transition-all duration-300 ${showDetails ? 'max-h-[50vh] lg:max-h-full' : 'max-h-0 lg:max-h-full overflow-hidden lg:overflow-y-auto'}`}>
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Artist</p>
                            <h2 className="text-lg sm:text-xl font-bold text-violet-400">{image.artist || 'Unknown'}</h2>
                        </div>
                    </div>

                    <div className="flex items-center space-x-3 sm:space-x-4 mb-6 sm:mb-8">
                        <button onClick={handleDownload} title="Download" className="flex-1 p-2.5 sm:p-3 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-xl transition border border-white/5"><DownloadIcon /></button>
                        <button onClick={handleFavoriteClick} title="Favorite" className="flex-1 p-2.5 sm:p-3 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-xl transition border border-white/5"><HeartIcon filled={isFavorited} /></button>
                        <div className="relative flex-1">
                            <button onClick={() => setShowListMenu(!showListMenu)} title="Add to List" className="w-full p-2.5 sm:p-3 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-xl transition border border-white/5"><PlusIcon /></button>
                            {showListMenu && (
                                <div className="absolute bottom-full mb-2 right-0 w-48 bg-white dark:bg-[#1a1a1a] border border-black/10 dark:border-white/10 rounded-xl shadow-2xl p-2 z-10 animate-fade-in">
                                   {isLoggedIn ? (
                                    <>
                                        {lists.length > 0 && lists.map(list => (
                                            <button key={list.name} onClick={() => handleAddToList(list.name)} className="w-full text-left px-3 py-2 text-xs hover:bg-white/5 rounded-lg transition">{list.name}</button>
                                        ))}
                                        <div className="mt-2 pt-2 border-t border-white/5">
                                            <input type="text" value={newListName} onChange={e => setNewListName(e.target.value)} placeholder="New list..." className="w-full bg-neutral-100 dark:bg-[#0a0a0a] border border-black/5 dark:border-white/5 text-xs p-2 rounded-lg mb-2 focus:outline-none focus:border-violet-500 text-gray-900 dark:text-white" />
                                            <button onClick={handleCreateList} className="w-full bg-violet-600 hover:bg-violet-700 text-xs py-2 rounded-lg font-bold transition">Create & Add</button>
                                        </div>
                                    </>
                                   ) : (
                                    <div className="p-2 text-center text-xs text-gray-500">
                                        <button onClick={onAuthRequest} className="text-violet-400 hover:underline">Log in</button> to save.
                                    </div>
                                   )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mb-6 grid grid-cols-2 gap-2">
                        <button onClick={openInPromptLab} className="rounded-xl bg-violet-600 px-3 py-2 text-xs font-bold text-white hover:bg-violet-700">Open in Prompt Lab</button>
                        <button onClick={openInPromptLab} className="rounded-xl bg-white/5 px-3 py-2 text-xs font-bold text-gray-400 hover:text-white">Analyze with AI</button>
                        <button onClick={openInPromptLab} className="rounded-xl bg-white/5 px-3 py-2 text-xs font-bold text-gray-400 hover:text-white">Generate SFW Prompt</button>
                        <button onClick={openInPromptLab} className="rounded-xl bg-white/5 px-3 py-2 text-xs font-bold text-gray-400 hover:text-white">Generate NSFW Prompt</button>
                        <button onClick={sendImageToComfy} className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700">Send to ComfyUI</button>
                        <button onClick={sendToChat} className="rounded-xl bg-cyan-600 px-3 py-2 text-xs font-bold text-white hover:bg-cyan-700">Send to Vault Chat</button>
                    </div>

                    <div className="space-y-2.5 sm:space-y-3 text-xs text-gray-500 border-t border-white/5 pt-4 sm:pt-6">
                        <div className="flex justify-between"><span className="font-bold uppercase tracking-tighter">Resolution</span> <span className="text-gray-300">{image.width} x {image.height}</span></div>
                        <div className="flex justify-between"><span className="font-bold uppercase tracking-tighter">Score</span> <span className="text-gray-300">{image.score}</span></div>
                        <div className="flex justify-between"><span className="font-bold uppercase tracking-tighter">Rating</span> <span className="text-gray-300 capitalize">{image.rating}</span></div>
                        <div className="flex justify-between"><span className="font-bold uppercase tracking-tighter">Source</span> <span className="text-gray-300 capitalize">{image.sourceApi}</span></div>
                        <div className="flex justify-between"><span className="font-bold uppercase tracking-tighter">Type</span> <span className="text-gray-300 capitalize">{image.type}</span></div>
                    </div>

                    <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-white/5">
                        <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Associated Tags</h3>
                        <div className="flex flex-wrap gap-1.5 sm:gap-2 max-h-36 sm:max-h-48 overflow-y-auto no-scrollbar">
                            {image.tags.map(tag => (
                                <span key={tag} className="bg-white/5 border border-white/5 text-gray-400 text-[10px] px-2 sm:px-2.5 py-1 rounded-full hover:text-white transition cursor-default">#{tag.replace(/_/g, '')}</span>
                            ))}
                        </div>
                    </div>

                    {(image.positivePrompt || image.negativePrompt) && (
                        <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-white/5 space-y-4">
                            {image.positivePrompt && (
                                <div className="space-y-2">
                                    <h3 className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                        Positive Prompt
                                    </h3>
                                    <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl text-[11px] text-gray-400 leading-relaxed max-h-32 sm:max-h-40 overflow-y-auto no-scrollbar italic">
                                        {image.positivePrompt}
                                    </div>
                                </div>
                            )}
                            {image.negativePrompt && (
                                <div className="space-y-2">
                                    <h3 className="text-[10px] font-bold text-red-500 uppercase tracking-widest flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                        Negative Prompt
                                    </h3>
                                    <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-xl text-[11px] text-gray-400 leading-relaxed max-h-24 sm:max-h-32 overflow-y-auto no-scrollbar italic">
                                        {image.negativePrompt}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
