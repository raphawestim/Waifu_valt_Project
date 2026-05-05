
import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { ImageGrid } from './components/ImageGrid';
import { ImageModal } from './components/ImageModal';
import { AuthModal } from './components/AuthModal';
import { ProfileView } from './components/ProfileView';
import { Spinner, FullScreenSpinner } from './components/Spinner';
import { EmptyState } from './components/EmptyState';
import { Pagination } from './components/Pagination';
import { HomeView } from './components/HomeView';
import { ComfyUIView } from './components/ComfyUIView';
import { TagExplorerView } from './components/TagExplorerView';
import { NsfwModal } from './components/NsfwModal';
import { NHentaiView } from './components/NHentaiView';
import { R34VideoView } from './components/R34VideoView';
import { R34VideoPlayerModal } from './components/R34VideoPlayerModal';
import { HHView } from './components/HHView';
import { searchImages, getRandomImages } from './services/imageService';
import { useAuth, AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import type { WaifuImage, SearchOptions } from './types';
import { DEFAULT_SEARCH_OPTIONS } from './constants';

type ViewType = 'home' | 'explore' | 'profile' | 'comfyui' | 'nhentai' | 'rule34video' | 'hentaihaven' | 'artists' | 'characters' | 'metadata';

const AppContent: React.FC = () => {
    const { user, favorites, lists } = useAuth();
    const [view, setView] = useState<ViewType>('home');
    
    // Core Data States
    const [gridImages, setGridImages] = useState<WaifuImage[]>([]);
    const [activeCollection, setActiveCollection] = useState<WaifuImage[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    
    // Modal & Navigation State
    const [selectedImage, setSelectedImage] = useState<{ image: WaifuImage, index: number } | null>(null);
    const [selectedR34Video, setSelectedR34Video] = useState<any | null>(null);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [isNsfwModalOpen, setIsNsfwModalOpen] = useState(false);
    const [nsfwCallbacks, setNsfwCallbacks] = useState<{ confirm: () => void, cancel: () => void } | null>(null);
    const [searchOptions, setSearchOptions] = useState<SearchOptions>(DEFAULT_SEARCH_OPTIONS);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const executeSearch = useCallback(async (options: SearchOptions, page: number) => {
        setIsLoading(true);
        try {
            const newImages = await searchImages(options, page);
            setGridImages(newImages);
            setActiveCollection(newImages);
            setHasMore(newImages.length >= options.limit - 5);
        } catch (error) {
            console.error("Failed to search images:", error);
            setGridImages([]);
            setActiveCollection([]);
        }
        setIsLoading(false);
    }, []);

    // Initial load with random images
    useEffect(() => {
        const loadInitial = async () => {
            setIsLoading(true);
            const random = await getRandomImages(40, DEFAULT_SEARCH_OPTIONS);
            setGridImages(random);
            setActiveCollection(random);
            setIsLoading(false);
        };
        loadInitial();
    }, []);
    
    const handleFilterChange = (options: SearchOptions) => {
        setSearchOptions(options);
        setCurrentPage(1);
        setView('explore');
        executeSearch(options, 1);
    };

    const handleSearch = (query: string) => {
        handleFilterChange({ ...searchOptions, query });
    };

    const handleTagSelect = (tag: string, type?: 'artist' | 'character' | 'metadata') => {
        let query = tag;
        // Danbooru convention for artist/character search
        if (type === 'artist') query = `artist:${tag}`;
        else if (type === 'character') query = `character:${tag}`;
        
        handleSearch(query);
    };

    const handleRequestNsfw = (onConfirm: () => void, onCancel: () => void) => {
        setNsfwCallbacks({ confirm: onConfirm, cancel: onCancel });
        setIsNsfwModalOpen(true);
    };

    const handleConfirmNsfw = () => {
        setIsNsfwModalOpen(false);
        if (nsfwCallbacks) nsfwCallbacks.confirm();
        setNsfwCallbacks(null);
    };

    const handleCancelNsfw = () => {
        setIsNsfwModalOpen(false);
        if (nsfwCallbacks) nsfwCallbacks.cancel();
        setNsfwCallbacks(null);
    };

    const handlePageChange = (newPage: number) => {
        if (newPage < 1) return;
        setCurrentPage(newPage);
        executeSearch(searchOptions, newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSelectImage = (image: WaifuImage, collection?: WaifuImage[]) => {
        const currentList = collection || gridImages;
        const index = currentList.findIndex(img => img.id === image.id);
        setActiveCollection(currentList);
        setSelectedImage({ image, index: index >= 0 ? index : 0 }); 
    };

    const handleNextImage = () => {
        if (!selectedImage || selectedImage.index >= activeCollection.length - 1) return;
        const nextIndex = selectedImage.index + 1;
        setSelectedImage({ image: activeCollection[nextIndex], index: nextIndex });
    };

    const handlePrevImage = () => {
        if (!selectedImage || selectedImage.index <= 0) return;
        const prevIndex = selectedImage.index - 1;
        setSelectedImage({ image: activeCollection[prevIndex], index: prevIndex });
    };

    const handleNavigate = (newView: ViewType | 'favorites') => {
        if (newView === 'favorites') {
            if (!user) {
                setIsAuthModalOpen(true);
                return;
            }
            setView('profile');
            return;
        }
        
        if (newView === 'profile' && !user) {
            setIsAuthModalOpen(true);
            return;
        }

        setView(newView as ViewType);
        window.scrollTo(0,0);
    };

    // Shared UI for Sub-views (ComfyUI / Explorers)
    const renderSubView = () => {
        if (view === 'comfyui') {
            return <ComfyUIView onImageClick={handleSelectImage} onNavigateHome={() => setView('home')} />;
        }
        if (view === 'nhentai') {
            return (
                <div className="flex bg-neutral-50 dark:bg-[#0a0a0a] min-h-screen w-full">
                    <Sidebar 
                        isOpen={isSidebarOpen} 
                        onClose={() => setIsSidebarOpen(false)} 
                        onFilterChange={handleFilterChange} 
                        onSearch={handleSearch} 
                        onNavigate={handleNavigate} 
                        currentOptions={searchOptions} 
                        isLoggedIn={!!user} 
                        currentView={view} 
                        onRequestNsfw={handleRequestNsfw}
                    />
                    <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'md:ml-80' : 'ml-0'}`}>
                        <NHentaiView onNavigateHome={() => setView('home')} />
                    </main>
                </div>
            );
        }
        if (view === 'rule34video') {
            return (
                <div className="flex bg-neutral-50 dark:bg-[#0a0a0a] min-h-screen w-full">
                    <Sidebar 
                        isOpen={isSidebarOpen} 
                        onClose={() => setIsSidebarOpen(false)} 
                        onFilterChange={handleFilterChange} 
                        onSearch={handleSearch} 
                        onNavigate={handleNavigate} 
                        currentOptions={searchOptions} 
                        isLoggedIn={!!user} 
                        currentView={view} 
                        onRequestNsfw={handleRequestNsfw}
                    />
                    <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'md:ml-80' : 'ml-0'}`}>
                        <R34VideoView onSelectVideo={(v) => setSelectedR34Video(v)} />
                    </main>
                </div>
            );
        }
        if (view === 'hentaihaven') {
            return (
                <div className="flex bg-neutral-50 dark:bg-[#0a0a0a] min-h-screen w-full">
                    <Sidebar 
                        isOpen={isSidebarOpen} 
                        onClose={() => setIsSidebarOpen(false)} 
                        onFilterChange={handleFilterChange} 
                        onSearch={handleSearch} 
                        onNavigate={handleNavigate} 
                        currentOptions={searchOptions} 
                        isLoggedIn={!!user} 
                        currentView={view} 
                        onRequestNsfw={handleRequestNsfw}
                    />
                    <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'md:ml-80' : 'ml-0'}`}>
                        <HHView />
                    </main>
                </div>
            );
        }
        if (view === 'artists' || view === 'characters' || view === 'metadata') {
            return (
                <div className="flex bg-neutral-50 dark:bg-[#0a0a0a] min-h-screen">
                    <Sidebar 
                        isOpen={isSidebarOpen} 
                        onClose={() => setIsSidebarOpen(false)} 
                        onFilterChange={handleFilterChange} 
                        onSearch={handleSearch} 
                        onNavigate={handleNavigate} 
                        currentOptions={searchOptions} 
                        isLoggedIn={!!user} 
                        currentView={view} 
                        onRequestNsfw={handleRequestNsfw}
                    />
                    <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'md:ml-80' : 'ml-0'}`}>
                         <TagExplorerView 
                            type={view as any} 
                            onTagClick={(tag) => handleTagSelect(tag, view as any)} 
                            onNavigateHome={() => setView('home')} 
                         />
                    </main>
                </div>
            );
        }
        return null;
    };

    const subView = renderSubView();
    if (subView) {
        return (
            <div className="flex bg-neutral-50 dark:bg-[#0a0a0a] min-h-screen text-gray-900 dark:text-gray-100 selection:bg-violet-500/30 transition-colors duration-300">
                {subView}
                {selectedImage && (
                    <ImageModal
                        image={selectedImage.image}
                        onClose={() => setSelectedImage(null)}
                        isLoggedIn={!!user}
                        onAuthRequest={() => setIsAuthModalOpen(true)}
                        onNext={handleNextImage}
                        onPrev={handlePrevImage}
                        canNext={selectedImage.index < activeCollection.length - 1}
                        canPrev={selectedImage.index > 0}
                    />
                )}
                {selectedR34Video && (
                    <R34VideoPlayerModal 
                        videoInfo={selectedR34Video} 
                        onClose={() => setSelectedR34Video(null)} 
                    />
                )}
                <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
                <NsfwModal isOpen={isNsfwModalOpen} onConfirm={handleConfirmNsfw} onCancel={handleCancelNsfw} />
            </div>
        );
    }

    if (view === 'home') {
        return (
            <div className="flex bg-neutral-50 dark:bg-[#0a0a0a] min-h-screen text-gray-900 dark:text-gray-100 selection:bg-violet-500/30 transition-colors duration-300">
                <HomeView 
                    currentOptions={searchOptions} 
                    onSearchSubmit={handleFilterChange} 
                    onRequestNsfw={handleRequestNsfw} 
                    onAuthRequest={() => setIsAuthModalOpen(true)}
                    onImageClick={handleSelectImage}
                    onNavigateHome={() => setView('home')}
                    onNavigateComfyUI={() => setView('comfyui')}
                    onNavigateArtists={() => setView('artists')}
                    onNavigateCharacters={() => setView('characters')}
                    onNavigateMetadata={() => setView('metadata')}
                />
                {selectedImage && (
                    <ImageModal
                        image={selectedImage.image}
                        onClose={() => setSelectedImage(null)}
                        isLoggedIn={!!user}
                        onAuthRequest={() => setIsAuthModalOpen(true)}
                        onNext={handleNextImage}
                        onPrev={handlePrevImage}
                        canNext={selectedImage.index < activeCollection.length - 1}
                        canPrev={selectedImage.index > 0}
                    />
                )}
                <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
                <NsfwModal isOpen={isNsfwModalOpen} onConfirm={handleConfirmNsfw} onCancel={handleCancelNsfw} />
            </div>
        );
    }

    return (
        <div className="flex bg-neutral-50 dark:bg-[#0a0a0a] min-h-screen text-gray-900 dark:text-gray-100 selection:bg-violet-500/30 transition-colors duration-300">
            <Sidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                onFilterChange={handleFilterChange}
                onSearch={handleSearch}
                onNavigate={handleNavigate}
                currentOptions={searchOptions}
                isLoggedIn={!!user}
                currentView={view}
                onRequestNsfw={handleRequestNsfw}
            />
            
            <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'md:ml-80' : 'ml-0'}`}>
                <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-md border-b border-black/5 dark:border-white/5 transition-colors">
                    <div className="flex items-center gap-4">
                        {!isSidebarOpen && (
                            <button 
                                onClick={() => setIsSidebarOpen(true)}
                                className="p-2 hover:bg-white/10 rounded-lg transition"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
                            </button>
                        )}
                        <h1 className="text-xl font-bold tracking-tight">
                            {view === 'explore' ? 'Vault Gallery' : 'Personal Collection'}
                        </h1>
                    </div>
                    
                    <div className="flex items-center gap-4">
                         {user ? (
                            <button onClick={() => handleNavigate('profile')} className="flex items-center gap-2 group">
                                <span className="hidden sm:block text-sm text-gray-400 group-hover:text-white transition">{user.username}</span>
                                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} className="w-8 h-8 rounded-full bg-violet-900/30 border border-violet-500/50" alt="avatar" />
                            </button>
                         ) : (
                            <button 
                                onClick={() => setIsAuthModalOpen(true)}
                                className="px-4 py-1.5 bg-violet-600 hover:bg-violet-700 rounded-full text-sm font-bold transition shadow-lg shadow-violet-900/20"
                            >
                                Join Vault
                            </button>
                         )}
                    </div>
                </header>

                <div className="p-6">
                    {view === 'explore' ? (
                        <>
                            {isLoading && gridImages.length === 0 ? (
                                <FullScreenSpinner label="Fetching images…" />
                            ) : (
                                <>
                                    <ImageGrid images={gridImages} onImageClick={(img) => handleSelectImage(img, gridImages)} />
                                    {gridImages.length === 0 && !isLoading && <EmptyState />}
                                    <Pagination currentPage={currentPage} onPageChange={handlePageChange} hasNextPage={hasMore} />
                                </>
                            )}
                        </>
                    ) : (
                        user && <ProfileView user={user} favorites={favorites} lists={lists} onImageClick={handleSelectImage} />
                    )}
                </div>
            </main>

            {selectedImage && (
                <ImageModal
                    image={selectedImage.image}
                    onClose={() => setSelectedImage(null)}
                    isLoggedIn={!!user}
                    onAuthRequest={() => setIsAuthModalOpen(true)}
                    onNext={handleNextImage}
                    onPrev={handlePrevImage}
                    canNext={selectedImage.index < activeCollection.length - 1}
                    canPrev={selectedImage.index > 0}
                />
            )}
            
            {selectedR34Video && (
                <R34VideoPlayerModal 
                    videoInfo={selectedR34Video} 
                    onClose={() => setSelectedR34Video(null)} 
                />
            )}
            
            <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
            <NsfwModal isOpen={isNsfwModalOpen} onConfirm={handleConfirmNsfw} onCancel={handleCancelNsfw} />
        </div>
    );
};

const App: React.FC = () => (
    <ThemeProvider>
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    </ThemeProvider>
);

export default App;
