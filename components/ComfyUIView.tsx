import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Spinner } from './Spinner';
import type { WaifuImage } from '../types';

interface ComfyUIImage {
    filename: string;
    folder: string;
    size: number;
    modified: number;
    url: string;
}

interface ComfyUIViewProps {
    onImageClick: (image: WaifuImage, collection: WaifuImage[]) => void;
    onNavigateHome: () => void;
}

const comfyToWaifu = (img: ComfyUIImage): WaifuImage => ({
    id: `comfyui-${img.folder}-${img.filename}`,
    thumbnailUrl: img.url,
    fullUrl: img.url,
    tags: [img.folder, img.filename.replace(/\.[^.]+$/, '')],
    score: 0,
    artist: 'ComfyUI / Local',
    sourceApi: 'comfyui',
    rating: 'safe',
    width: 0,
    height: 0,
    type: 'image',
    positivePrompt: (img as any).positivePrompt,
    negativePrompt: (img as any).negativePrompt,
});

export const ComfyUIView: React.FC<ComfyUIViewProps> = ({ onImageClick, onNavigateHome }) => {
    const { theme, toggleTheme } = useTheme();
    const [folders, setFolders] = useState<string[]>([]);
    const [activeFolder, setActiveFolder] = useState<string>('');
    const [images, setImages] = useState<ComfyUIImage[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch folder list
    useEffect(() => {
        fetch('/api/comfyui/folders')
            .then(r => r.json())
            .then((data: string[]) => {
                setFolders(data);
                if (data.length > 0) setActiveFolder(data[0]);
            })
            .catch(console.error);
    }, []);

    // Fetch images when folder changes
    useEffect(() => {
        if (!activeFolder) return;
        setLoading(true);
        fetch(`/api/comfyui/images?folder=${encodeURIComponent(activeFolder)}`)
            .then(r => r.json())
            .then((data: ComfyUIImage[]) => {
                setImages(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [activeFolder]);

    const waifuImages = images.map(comfyToWaifu);

    const handleImageClick = (img: ComfyUIImage) => {
        const waifu = comfyToWaifu(img);
        onImageClick(waifu, waifuImages);
    };

    return (
        <div className="w-full min-h-screen bg-neutral-50 dark:bg-[#0a0a0a] transition-colors duration-300">
            {/* Top Navigation Bar */}
            <nav className="sticky top-0 z-30 px-6 py-4 flex justify-between items-center bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-md border-b border-black/5 dark:border-white/5">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onNavigateHome}
                        className="flex items-center gap-2 hover:opacity-75 transition-opacity focus:outline-none"
                        title="Back to Home"
                    >
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M2 12L12 17L22 12" stroke="#8b5cf6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <h1 className="text-xl font-black tracking-tight text-gray-900 dark:text-white">
                            WAIFU<span className="text-violet-600 dark:text-violet-500">VAULT</span>
                        </h1>
                    </button>
                    <span className="text-gray-300 dark:text-gray-600 text-xl font-thin">/</span>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <h2 className="text-lg font-bold text-gray-700 dark:text-gray-200">ComfyUI Studio</h2>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button onClick={toggleTheme} className="p-2 rounded-full border border-black/10 dark:border-white/10 bg-white dark:bg-[#151515] text-gray-600 dark:text-gray-300 hover:bg-neutral-100 dark:hover:bg-white/5 transition shadow-md">
                        {theme === 'dark' ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                        ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                        )}
                    </button>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Header Section */}
                <div className="mb-8">
                    <h2 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white mb-2">
                        🎨 My Generations
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                        Browse your locally generated ComfyUI artworks • {images.length} images
                    </p>
                </div>

                {/* Folder Tabs */}
                <div className="flex items-center gap-2 mb-8 overflow-x-auto no-scrollbar pb-2">
                    {folders.map(folder => (
                        <button
                            key={folder}
                            onClick={() => setActiveFolder(folder)}
                            className={`px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all border shadow-sm ${
                                activeFolder === folder
                                    ? 'bg-violet-600 text-white border-violet-600 shadow-violet-500/30'
                                    : 'bg-white dark:bg-[#151515] text-gray-600 dark:text-gray-300 border-black/5 dark:border-white/10 hover:border-violet-500/30 hover:text-violet-600 dark:hover:text-violet-400'
                            }`}
                        >
                            📁 {folder}
                        </button>
                    ))}
                </div>

                {/* Image Grid */}
                {loading ? (
                    <div className="flex items-center justify-center h-[50vh]">
                        <Spinner label="Loading generations…" />
                    </div>
                ) : images.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[50vh] text-gray-500 dark:text-gray-400">
                        <svg className="w-16 h-16 mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-lg font-bold">No images found</p>
                        <p className="text-sm">This folder appears to be empty.</p>
                    </div>
                ) : (
                    <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-4 space-y-4">
                        {images.map((img) => (
                            <div
                                key={img.filename}
                                onClick={() => handleImageClick(img)}
                                className="group relative break-inside-avoid rounded-2xl overflow-hidden cursor-pointer bg-neutral-200 dark:bg-white/5 border border-black/5 dark:border-white/5 shadow-md hover:shadow-xl hover:ring-2 hover:ring-violet-500/50 transition-all duration-300"
                            >
                                <img
                                    src={img.url}
                                    alt={img.filename}
                                    className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                                    loading="lazy"
                                />
                                {/* Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                                    <div className="text-white">
                                        <p className="text-xs font-bold truncate max-w-[180px]">{img.filename}</p>
                                        <p className="text-[10px] text-white/60">{(img.size / 1024 / 1024).toFixed(1)} MB</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
