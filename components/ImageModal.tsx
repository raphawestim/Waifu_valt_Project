
import React, { useState, useEffect } from 'react';
import type { WaifuImage } from '../types';
import { useAuth } from '../context/AuthContext';
import { Spinner } from './Spinner';

const CloseIcon = () => (<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>);
const DownloadIcon = () => (<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>);
const HeartIcon = ({ filled }: { filled: boolean }) => (<svg className={`w-6 h-6 transition-colors ${filled ? 'text-red-500 fill-current' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z"></path></svg>);
const PlusIcon = () => (<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>);

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
        className={`absolute top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 text-white hover:bg-black/70 transition-all disabled:opacity-0 disabled:pointer-events-none z-20 ${direction === 'left' ? 'left-4' : 'right-4'}`}
    >
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {direction === 'left' ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            )}
        </svg>
    </button>
);


export const ImageModal: React.FC<ImageModalProps> = ({ image, onClose, isLoggedIn, onAuthRequest, onNext, onPrev, canNext, canPrev }) => {
    const { addFavorite, removeFavorite, isFavorite, lists, createList, addImageToList } = useAuth();
    const [isFavorited, setIsFavorited] = useState(false);
    const [showListMenu, setShowListMenu] = useState(false);
    const [newListName, setNewListName] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsFavorited(isFavorite(image.id));
    }, [image, isFavorite]);
    
    useEffect(() => {
        setIsLoading(true);
    }, [image]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight' && canNext) onNext();
            if (e.key === 'ArrowLeft' && canPrev) onPrev();
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [canNext, canPrev, onNext, onPrev, onClose]);

    const handleFavoriteClick = () => {
        if (!isLoggedIn) {
            onAuthRequest();
            return;
        }
        if (isFavorited) removeFavorite(image.id);
        else addFavorite(image);
        setIsFavorited(!isFavorited);
    };
    
    const handleAddToList = (listName: string) => {
        if (!isLoggedIn) {
            onAuthRequest();
            return;
        }
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
        fetch(image.fullUrl)
            .then(res => res.blob())
            .then(blob => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                const fileName = image.fullUrl.split('/').pop() || 'waifu.jpg';
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
            })
            .catch(err => console.error('Error downloading image:', err));
    };

    return (
        <div className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div className="relative w-full h-full flex flex-col lg:flex-row gap-4" onClick={(e) => e.stopPropagation()}>
                <div className="flex-1 flex items-center justify-center bg-black/20 rounded-lg overflow-hidden relative group">
                    {isLoading && <Spinner />}
                     {image.type === 'video' ? (
                        <video
                            key={image.id}
                            src={image.fullUrl}
                            controls
                            autoPlay
                            loop
                            muted
                            playsInline
                            onLoadedData={() => setIsLoading(false)}
                            className={`max-w-full max-h-full object-contain transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
                        >
                            Your browser does not support the video tag.
                        </video>
                    ) : (
                         <img 
                            key={image.id}
                            src={image.fullUrl} 
                            alt={image.tags.slice(0, 5).join(', ')} 
                            className={`max-w-full max-h-full object-contain transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
                            onLoad={() => setIsLoading(false)}
                        />
                    )}
                    
                    {/* Navigation UI */}
                    <ArrowButton direction="left" onClick={onPrev} disabled={!canPrev} />
                    <ArrowButton direction="right" onClick={onNext} disabled={!canNext} />
                </div>
                
                <div className="w-full lg:w-96 bg-white dark:bg-[#0f0f0f] border border-black/5 dark:border-white/5 rounded-2xl p-6 flex flex-col overflow-y-auto no-scrollbar shadow-2xl text-gray-900 dark:text-gray-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Artist</p>
                            <h2 className="text-xl font-bold text-violet-400">{image.artist || 'Unknown'}</h2>
                        </div>
                        <button onClick={onClose} className="p-2 text-gray-400 hover:text-white transition rounded-full hover:bg-white/5">
                           <CloseIcon />
                        </button>
                    </div>

                    <div className="flex items-center space-x-4 my-8">
                        <button onClick={handleDownload} title="Download" className="flex-1 p-3 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-xl transition border border-white/5"><DownloadIcon /></button>
                        <button onClick={handleFavoriteClick} title="Favorite" className="flex-1 p-3 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-xl transition border border-white/5"><HeartIcon filled={isFavorited} /></button>
                        <div className="relative flex-1">
                            <button onClick={() => setShowListMenu(!showListMenu)} title="Add to List" className="w-full p-3 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-xl transition border border-white/5"><PlusIcon /></button>
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

                    <div className="space-y-3 text-xs text-gray-500 border-t border-white/5 pt-6">
                        <div className="flex justify-between"><span className="font-bold uppercase tracking-tighter">Resolution</span> <span className="text-gray-300">{image.width} x {image.height}</span></div>
                        <div className="flex justify-between"><span className="font-bold uppercase tracking-tighter">Score</span> <span className="text-gray-300">{image.score}</span></div>
                        <div className="flex justify-between"><span className="font-bold uppercase tracking-tighter">Rating</span> <span className="text-gray-300 capitalize">{image.rating}</span></div>
                        <div className="flex justify-between"><span className="font-bold uppercase tracking-tighter">Source</span> <span className="text-gray-300 capitalize">{image.sourceApi}</span></div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-white/5">
                        <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Associated Tags</h3>
                        <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto no-scrollbar">
                            {image.tags.map(tag => (
                                <span key={tag} className="bg-white/5 border border-white/5 text-gray-400 text-[10px] px-2.5 py-1 rounded-full hover:text-white transition cursor-default">#{tag.replace(/_/g, '')}</span>
                            ))}
                        </div>
                    </div>

                    {(image.positivePrompt || image.negativePrompt) && (
                        <div className="mt-6 pt-6 border-t border-white/5 space-y-4">
                            {image.positivePrompt && (
                                <div className="space-y-2">
                                    <h3 className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                        Positive Prompt
                                    </h3>
                                    <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl text-[11px] text-gray-400 leading-relaxed max-h-40 overflow-y-auto no-scrollbar italic">
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
                                    <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-xl text-[11px] text-gray-400 leading-relaxed max-h-32 overflow-y-auto no-scrollbar italic">
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
