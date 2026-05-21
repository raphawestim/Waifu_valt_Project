
import React, { Suspense, useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { ImageGrid } from './components/ImageGrid';
import { AuthModal } from './components/AuthModal';
import { FullScreenSpinner } from './components/Spinner';
import { EmptyState } from './components/EmptyState';
import { Pagination } from './components/Pagination';
import { NsfwModal } from './components/NsfwModal';
import { searchImages, getRandomImages } from './services/imageService';
import { useAuth, AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import type { GallerySortOption, SourceApi, WaifuImage, SearchOptions, NHentaiGallery } from './types';
import { API_FAVICONS, DEFAULT_SEARCH_OPTIONS } from './constants';
import { AIProvider, useAI } from './components/AI/AIContext';
import { VaultChatDrawer } from './components/VaultChat/VaultChatDrawer';
import { LocalAIStatus } from './components/AI/LocalAIStatus';
import { TheVaultPortal } from './areas/portal/pages/TheVaultPortal';
import { GamesHome } from './areas/games/pages/GamesHome';
import { TcgHome } from './areas/tcg/pages/TcgHome';
import { MangaAnimeHome } from './areas/manga/pages/MangaAnimeHome';
import { RpgHome } from './areas/rpg/pages/RpgHome';
import { ForgeHome } from './areas/forge/pages/ForgeHome';
import { LoginPage } from './areas/auth/pages/LoginPage';
import { RegisterPage } from './areas/auth/pages/RegisterPage';
import { UserProfilePage } from './areas/profile/pages/UserProfilePage';
import { NsfwAccessModal } from './features/nsfwGate/components/NsfwAccessModal';
import { useNsfwGate } from './features/nsfwGate/hooks/useNsfwGate';
import { TheValtAreaSwitchButton } from './components/shell/TheValtAreaSwitchButton';
import type { VaultId } from './data/vaultRegistry';
import type { AppArea } from './types/app.types';

const HomeView = React.lazy(() => import('./components/HomeView').then(module => ({ default: module.HomeView })));
const ImageModal = React.lazy(() => import('./components/ImageModal').then(module => ({ default: module.ImageModal })));
const ProfileView = React.lazy(() => import('./components/ProfileView').then(module => ({ default: module.ProfileView })));
const ComfyUIView = React.lazy(() => import('./components/ComfyUIView').then(module => ({ default: module.ComfyUIView })));
const PromptLabView = React.lazy(() => import('./components/PromptLab/PromptLabView').then(module => ({ default: module.PromptLabView })));
const SettingsView = React.lazy(() => import('./components/SettingsView').then(module => ({ default: module.SettingsView })));
const TagExplorerView = React.lazy(() => import('./components/TagExplorerView').then(module => ({ default: module.TagExplorerView })));
const NHentaiView = React.lazy(() => import('./components/NHentaiView').then(module => ({ default: module.NHentaiView })));
const EHentaiView = React.lazy(() => import('./components/EHentaiView').then(module => ({ default: module.EHentaiView })));
const R34VideoView = React.lazy(() => import('./components/R34VideoView').then(module => ({ default: module.R34VideoView })));
const R34VideoPlayerModal = React.lazy(() => import('./components/R34VideoPlayerModal').then(module => ({ default: module.R34VideoPlayerModal })));
const HHView = React.lazy(() => import('./components/HHView').then(module => ({ default: module.HHView })));
const MangaReaderModal = React.lazy(() => import('./components/MangaReaderModal').then(module => ({ default: module.MangaReaderModal })));

type ViewType = 'home' | 'explore' | 'profile' | 'comfyui' | 'prompt-lab' | 'settings' | 'nhentai' | 'ehentai' | 'rule34video' | 'hentaihaven' | 'artists' | 'characters' | 'metadata';

const getAreaFromPath = (pathname: string): AppArea => {
    if (pathname.startsWith('/login')) return 'login';
    if (pathname.startsWith('/register')) return 'register';
    if (pathname.startsWith('/profile')) return 'profile';
    if (pathname.startsWith('/games')) return 'games';
    if (pathname.startsWith('/tcg')) return 'tcg';
    if (pathname.startsWith('/manga')) return 'manga';
    if (pathname.startsWith('/rpg')) return 'rpg';
    if (pathname.startsWith('/forge') || pathname.startsWith('/prompt-lab')) return 'forge';
    if (pathname.startsWith('/nsfw')) return 'nsfw';
    return 'portal';
};

const GallerySearchIcon = () => (
    <svg className="h-5 w-5 text-violet-200/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);

const GallerySkeleton: React.FC = () => (
    <div className="vault-gallery-grid">
        {Array.from({ length: 18 }).map((_, index) => (
            <div
                key={index}
                className="vault-gallery-item overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] shadow-2xl shadow-black/30"
            >
                <div className={`${index % 5 === 0 ? 'aspect-[4/5]' : index % 3 === 0 ? 'aspect-video' : 'aspect-[3/4]'} animate-pulse bg-gradient-to-br from-white/10 via-violet-500/10 to-cyan-500/10`} />
                <div className="space-y-2 p-4">
                    <div className="h-3 w-2/3 rounded-full bg-white/10" />
                    <div className="h-2 w-1/2 rounded-full bg-white/5" />
                </div>
            </div>
        ))}
    </div>
);

interface GalleryControlsProps {
    currentOptions: SearchOptions;
    query: string;
    resultCount: number;
    isLoading: boolean;
    onQueryChange: (query: string) => void;
    onSearchSubmit: (event: React.FormEvent) => void;
    onSourceToggle: (source: SourceApi) => void;
    onContentTypeChange: (type: SearchOptions['contentType']) => void;
    onSortChange: (sortBy: GallerySortOption) => void;
}

const GalleryControls: React.FC<GalleryControlsProps> = ({
    currentOptions,
    query,
    resultCount,
    isLoading,
    onQueryChange,
    onSearchSubmit,
    onSourceToggle,
    onContentTypeChange,
    onSortChange,
}) => {
    const sources: SourceApi[] = ['waifu.im', 'gelbooru', 'rule34', 'konachan', 'yandere', 'danbooru'];
    const sortOptions: Array<{ id: GallerySortOption; label: string }> = [
        { id: 'newest', label: 'Newest' },
        { id: 'trending', label: 'Trending' },
        { id: 'most_viewed', label: 'Most Viewed' },
        { id: 'rating', label: 'Rating' },
    ];
    const contentTypes: Array<{ id: SearchOptions['contentType']; label: string }> = [
        { id: 'all', label: 'All' },
        { id: 'images', label: 'Images' },
        { id: 'videos', label: 'Videos' },
        { id: 'gifs', label: 'GIFs' },
    ];

    return (
        <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#090912]/85 p-5 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-6 lg:p-7">
            <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-violet-600/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-28 left-12 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
            <div className="relative grid gap-6 xl:grid-cols-[1.15fr_0.85fr] xl:items-end">
                <div>
                    <div className="mb-4 flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-red-500/25 bg-red-500/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-red-200 shadow-[0_0_22px_rgba(239,68,68,0.12)]">
                            NSFW Vault
                        </span>
                        <span className="rounded-full border border-violet-400/20 bg-violet-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-violet-100">
                            Explore APIs
                        </span>
                        <span className="text-xs font-medium text-gray-500">
                            {isLoading ? 'Syncing sources...' : `${resultCount} results loaded`}
                        </span>
                    </div>
                    <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">
                        The Vault NSFW
                    </h1>
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-400">
                        Browse unified image boards with richer previews, fast filters, source chips and creative AI actions right inside each card.
                    </p>
                    <form onSubmit={onSearchSubmit} className="mt-6 flex flex-col gap-3 sm:flex-row">
                        <label className="relative min-w-0 flex-1">
                            <span className="absolute inset-y-0 left-4 flex items-center">
                                <GallerySearchIcon />
                            </span>
                            <input
                                value={query}
                                onChange={(event) => onQueryChange(event.target.value)}
                                className="h-14 w-full rounded-2xl border border-white/10 bg-black/35 pl-12 pr-4 text-base font-semibold text-white outline-none transition placeholder:text-gray-600 focus:border-violet-400/70 focus:bg-black/50 focus:ring-4 focus:ring-violet-500/15"
                                placeholder="Search tags, artists, characters..."
                            />
                        </label>
                        <button
                            type="submit"
                            className="h-14 rounded-2xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-cyan-500 px-6 text-sm font-black uppercase tracking-[0.16em] text-white shadow-lg shadow-violet-900/30 transition hover:scale-[1.02] hover:shadow-violet-700/30"
                        >
                            Search
                        </button>
                    </form>
                </div>

                <div className="space-y-4">
                    <div>
                        <div className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Format</div>
                        <div className="grid grid-cols-4 gap-1 rounded-2xl border border-white/10 bg-black/30 p-1">
                            {contentTypes.map((type) => (
                                <button
                                    key={type.id}
                                    onClick={() => onContentTypeChange(type.id)}
                                    className={`rounded-xl px-2 py-2 text-xs font-black transition ${
                                        currentOptions.contentType === type.id
                                            ? 'bg-white text-black shadow-lg'
                                            : 'text-gray-500 hover:bg-white/10 hover:text-white'
                                    }`}
                                >
                                    {type.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <div className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Sort by</div>
                        <div className="flex flex-wrap gap-2">
                            {sortOptions.map((option) => (
                                <button
                                    key={option.id}
                                    onClick={() => onSortChange(option.id)}
                                    className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                                        (currentOptions.sortBy || 'newest') === option.id
                                            ? 'border-cyan-300/40 bg-cyan-400/15 text-cyan-100 shadow-[0_0_22px_rgba(34,211,238,0.12)]'
                                            : 'border-white/10 bg-white/[0.03] text-gray-500 hover:border-white/20 hover:text-white'
                                    }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="relative mt-6 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {sources.map((source) => {
                    const active = currentOptions.sources.includes(source);
                    return (
                        <button
                            key={source}
                            onClick={() => onSourceToggle(source)}
                            className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-xs font-bold transition ${
                                active
                                    ? 'border-violet-300/40 bg-violet-500/20 text-violet-100 shadow-[0_0_22px_rgba(139,92,246,0.15)]'
                                    : 'border-white/10 bg-black/25 text-gray-500 hover:border-white/20 hover:text-white'
                            }`}
                        >
                            <img src={API_FAVICONS[source]} alt="" className="h-4 w-4 rounded-sm object-contain" />
                            {source}
                        </button>
                    );
                })}
            </div>
        </section>
    );
};

const AppContent: React.FC = () => {
    const { user, favorites, lists, login, logout } = useAuth();
    const { promptLabImage, setPromptLabImage } = useAI();
    const [activeArea, setActiveArea] = useState<AppArea>(() => getAreaFromPath(window.location.pathname));
    const [view, setView] = useState<ViewType>('home');
    const currentUserId = user ? user.id || `local-${user.username}` : undefined;
    const nsfwGate = useNsfwGate(currentUserId);
    
    // Core Data States
    const [gridImages, setGridImages] = useState<WaifuImage[]>([]);
    const [activeCollection, setActiveCollection] = useState<WaifuImage[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    
    // Modal & Navigation State
    const [selectedImage, setSelectedImage] = useState<{ image: WaifuImage, index: number } | null>(null);
    const [selectedR34Video, setSelectedR34Video] = useState<any | null>(null);
    const [selectedGallery, setSelectedGallery] = useState<NHentaiGallery | null>(null);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [isNsfwModalOpen, setIsNsfwModalOpen] = useState(false);
    const [nsfwCallbacks, setNsfwCallbacks] = useState<{ confirm: () => void, cancel: () => void } | null>(null);
    const [searchOptions, setSearchOptions] = useState<SearchOptions>(DEFAULT_SEARCH_OPTIONS);
    const [galleryQuery, setGalleryQuery] = useState(DEFAULT_SEARCH_OPTIONS.query);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const setAreaRoute = useCallback((area: AppArea, mode: 'push' | 'replace' = 'push') => {
        const nextPath = area === 'portal' ? '/' : `/${area}`;
        if (window.location.pathname !== nextPath) {
            window.history[mode === 'push' ? 'pushState' : 'replaceState']({}, '', nextPath);
        }
        setActiveArea(area);
        if (area !== 'nsfw') {
            setView('home');
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    const requestNsfwAreaAccess = useCallback(() => {
        if (user && nsfwGate.hasAccess) {
            setAreaRoute('nsfw');
            setView('home');
            return;
        }
        nsfwGate.openGate();
    }, [nsfwGate, setAreaRoute, user]);

    const handleEnterVault = useCallback((vaultId: VaultId) => {
        if (vaultId === 'nsfw') {
            requestNsfwAreaAccess();
            return;
        }
        setAreaRoute(vaultId);
    }, [requestNsfwAreaAccess, setAreaRoute]);

    const enterNsfwArea = useCallback(() => {
        nsfwGate.acceptTerms();
        setAreaRoute('nsfw');
        setView('home');
    }, [nsfwGate, setAreaRoute]);

    const navigateToLogin = useCallback(() => setAreaRoute('login'), [setAreaRoute]);
    const navigateToRegister = useCallback(() => setAreaRoute('register'), [setAreaRoute]);
    const navigateToProfile = useCallback(() => setAreaRoute('profile'), [setAreaRoute]);

    const handleAuthSubmit = useCallback(async (username: string) => {
        await login(username);
        setAreaRoute('profile');
    }, [login, setAreaRoute]);

    const handleLogout = useCallback(() => {
        logout();
        setAreaRoute('portal', 'replace');
    }, [logout, setAreaRoute]);

    const leaveNsfwToPortal = useCallback(() => {
        setAreaRoute('portal');
        setView('home');
    }, [setAreaRoute]);

    useEffect(() => {
        const handlePopState = () => {
            const nextArea = getAreaFromPath(window.location.pathname);
            if (nextArea === 'nsfw' && (!user || !nsfwGate.hasAccess)) {
                setAreaRoute('portal', 'replace');
                nsfwGate.openGate();
                return;
            }
            setActiveArea(nextArea);
            setView('home');
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [nsfwGate, setAreaRoute, user]);

    useEffect(() => {
        if (activeArea !== 'nsfw') return;
        if (user && nsfwGate.hasAccess) return;

        setAreaRoute('portal', 'replace');
        nsfwGate.openGate();
    }, [activeArea, nsfwGate, setAreaRoute, user]);

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

    // Load the gallery only when the user opens the explore view directly.
    useEffect(() => {
        if (view !== 'explore' || gridImages.length > 0 || searchOptions.query) return;

        let isCancelled = false;
        const loadInitial = async () => {
            setIsLoading(true);
            const random = await getRandomImages(40, DEFAULT_SEARCH_OPTIONS);
            if (isCancelled) return;
            setGridImages(random);
            setActiveCollection(random);
            setIsLoading(false);
        };

        loadInitial();

        return () => {
            isCancelled = true;
        };
    }, [gridImages.length, searchOptions.query, view]);

    // Enforce lock down on logout (No longer needed since NSFW is always on)
    useEffect(() => {
        if (!user) {
            if (activeArea === 'nsfw') {
                setAreaRoute('portal', 'replace');
                setView('home');
            }
            if (['nhentai', 'ehentai', 'rule34video', 'hentaihaven'].includes(view)) {
                setView('home');
            }
        }
    }, [activeArea, setAreaRoute, user, view]);

    useEffect(() => {
        const handleNavigateEvent = (event: Event) => {
            const detail = (event as CustomEvent<{ view?: ViewType }>).detail;
            if (detail?.view) setView(detail.view);
        };
        window.addEventListener('wv:navigate', handleNavigateEvent);
        return () => window.removeEventListener('wv:navigate', handleNavigateEvent);
    }, []);

    useEffect(() => {
        setGalleryQuery(searchOptions.query);
    }, [searchOptions.query]);
    
    
    const handleFilterChange = (options: SearchOptions) => {
        setSearchOptions(options);
        setCurrentPage(1);
        setView('explore');
        executeSearch(options, 1);
    };

    const handleSearch = (query: string) => {
        handleFilterChange({ ...searchOptions, query });
    };

    const handleGallerySearchSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        handleSearch(galleryQuery);
    };

    const handleGallerySourceToggle = (source: SourceApi) => {
        const updatedSources = searchOptions.sources.includes(source)
            ? searchOptions.sources.filter(item => item !== source)
            : [...searchOptions.sources, source];
        handleFilterChange({ ...searchOptions, sources: updatedSources });
    };

    const handleGalleryContentTypeChange = (contentType: SearchOptions['contentType']) => {
        handleFilterChange({ ...searchOptions, contentType });
    };

    const handleGallerySortChange = (sortBy: GallerySortOption) => {
        handleFilterChange({ ...searchOptions, sortBy });
    };

    const handleConfirmNsfwAreaAccess = () => {
        if (!user) {
            setAreaRoute('login');
            return;
        }
        enterNsfwArea();
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
        
        if (['profile', 'nhentai', 'ehentai', 'rule34video', 'hentaihaven'].includes(newView)) {
            if (!user) {
                setIsAuthModalOpen(true);
                return;
            }
            if (['nhentai', 'ehentai', 'rule34video', 'hentaihaven'].includes(newView) && !searchOptions.isNsfwEnabled) {
                // Ignore navigation if NSFW is not toggled on
                return;
            }
        }

        setView(newView as ViewType);
        window.scrollTo(0,0);
    };

    // Shared UI for Sub-views (ComfyUI / Explorers)
    const renderSubView = () => {
        if (view === 'comfyui') {
            return <ComfyUIView onImageClick={handleSelectImage} onNavigateHome={() => setView('home')} />;
        }
        if (view === 'prompt-lab') {
            return <PromptLabView image={promptLabImage} onNavigateHome={() => setView('home')} onNavigateComfyUI={() => setView('comfyui')} />;
        }
        if (view === 'settings') {
            return <SettingsView onNavigateHome={() => setView('home')} />;
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
        if (view === 'ehentai') {
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
                        <EHentaiView onNavigateHome={() => setView('home')} />
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

    const showNsfwPortalCard = !(user && nsfwGate.settings.hideNsfwFromPortal);
    const nsfwAccessModal = (
        <NsfwAccessModal
            isOpen={nsfwGate.isGateOpen}
            isLoggedIn={!!user}
            onClose={nsfwGate.closeGate}
            onLoginRequest={navigateToLogin}
            onRegisterRequest={navigateToRegister}
            onProfileSettings={navigateToProfile}
            onConfirm={handleConfirmNsfwAreaAccess}
        />
    );

    if (activeArea === 'login') {
        return (
            <div className="min-h-screen bg-[#05050a] text-white">
                <LoginPage
                    onBackToPortal={() => setAreaRoute('portal')}
                    onSubmit={handleAuthSubmit}
                    onRegister={navigateToRegister}
                />
            </div>
        );
    }

    if (activeArea === 'register') {
        return (
            <div className="min-h-screen bg-[#05050a] text-white">
                <RegisterPage
                    onBackToPortal={() => setAreaRoute('portal')}
                    onSubmit={handleAuthSubmit}
                    onLogin={navigateToLogin}
                />
            </div>
        );
    }

    if (activeArea === 'profile') {
        return (
            <div className="min-h-screen bg-[#05050a] text-white">
                <UserProfilePage
                    user={user}
                    favorites={favorites}
                    onBackToPortal={() => setAreaRoute('portal')}
                    onLogin={navigateToLogin}
                    onRegister={navigateToRegister}
                    onLogout={handleLogout}
                    onSettingsChange={nsfwGate.refresh}
                />
            </div>
        );
    }

    if (activeArea === 'portal') {
        return (
            <div className="min-h-screen bg-[#05050a] text-white">
                <TheVaultPortal
                    user={user}
                    showNsfwCard={showNsfwPortalCard}
                    onEnterVault={handleEnterVault}
                    onLogin={navigateToLogin}
                    onRegister={navigateToRegister}
                    onProfile={navigateToProfile}
                    onLogout={handleLogout}
                />
                {nsfwAccessModal}
                <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
            </div>
        );
    }

    if (activeArea === 'games') {
        return (
            <div className="min-h-screen bg-[#05050a] text-white">
                <GamesHome
                    isLoggedIn={!!user}
                    username={user?.username}
                    userId={currentUserId}
                    onBackToPortal={() => setAreaRoute('portal')}
                    onEnterTcg={() => setAreaRoute('tcg')}
                    onEnterManga={() => setAreaRoute('manga')}
                    onEnterNsfw={requestNsfwAreaAccess}
                    onLoginClick={navigateToLogin}
                />
                {nsfwAccessModal}
                <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
            </div>
        );
    }

    if (activeArea === 'tcg') {
        return (
            <div className="min-h-screen bg-[#05050a] text-white">
                <TcgHome
                    isLoggedIn={!!user}
                    username={user?.username}
                    userId={currentUserId}
                    onBackToPortal={() => setAreaRoute('portal')}
                    onEnterNsfw={requestNsfwAreaAccess}
                    onLoginClick={navigateToLogin}
                />
                {nsfwAccessModal}
                <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
            </div>
        );
    }

    if (activeArea === 'manga') {
        return (
            <div className="min-h-screen bg-[#05050a] text-white">
                <MangaAnimeHome
                    isLoggedIn={!!user}
                    username={user?.username}
                    userId={currentUserId}
                    onBackToPortal={() => setAreaRoute('portal')}
                    onEnterGames={() => setAreaRoute('games')}
                    onEnterNsfw={requestNsfwAreaAccess}
                    onLoginClick={navigateToLogin}
                />
                {nsfwAccessModal}
                <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
            </div>
        );
    }

    if (activeArea === 'rpg') {
        return (
            <div className="min-h-screen bg-[#05050a] text-white">
                <RpgHome
                    isLoggedIn={!!user}
                    username={user?.username}
                    userId={currentUserId}
                    onBackToPortal={() => setAreaRoute('portal')}
                    onEnterNsfw={requestNsfwAreaAccess}
                    onLoginClick={navigateToLogin}
                />
                {nsfwAccessModal}
                <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
            </div>
        );
    }

    if (activeArea === 'forge') {
        return (
            <div className="min-h-screen bg-[#05050a] text-white">
                <ForgeHome
                    isLoggedIn={!!user}
                    username={user?.username}
                    onBackToPortal={() => setAreaRoute('portal')}
                    onLoginClick={navigateToLogin}
                />
                <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
            </div>
        );
    }

    if (activeArea === 'nsfw' && (!user || !nsfwGate.hasAccess)) {
        return (
            <div className="min-h-screen bg-[#05050a] text-white">
                <TheVaultPortal
                    user={user}
                    showNsfwCard={showNsfwPortalCard}
                    onEnterVault={handleEnterVault}
                    onLogin={navigateToLogin}
                    onRegister={navigateToRegister}
                    onProfile={navigateToProfile}
                    onLogout={handleLogout}
                />
                {nsfwAccessModal}
                <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
            </div>
        );
    }

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
                <VaultChatDrawer
                    onOpenPromptLab={(prompt) => {
                        if (prompt) {
                            setPromptLabImage({
                                imageUrl: promptLabImage?.imageUrl || '',
                                thumbnailUrl: promptLabImage?.thumbnailUrl,
                                imageId: promptLabImage?.imageId,
                                source: promptLabImage?.source,
                                tags: promptLabImage?.tags,
                            });
                        }
                        setView('prompt-lab');
                    }}
                    onOpenComfyUI={() => setView('comfyui')}
                />
                <TheValtAreaSwitchButton
                    targetArea="portal"
                    label="The Vault Portal"
                    caption="Choose another vault"
                    onClick={leaveNsfwToPortal}
                />
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
                    onNavigateProfile={() => setView('profile')}
                    onSelectVideo={(v) => setSelectedR34Video(v)}
                    onSelectGallery={(g) => {
                        setSelectedGallery(g);
                    }}
                    onSelectAnime={() => setView('hentaihaven')}
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
                <VaultChatDrawer
                    onOpenPromptLab={() => setView('prompt-lab')}
                    onOpenComfyUI={() => setView('comfyui')}
                />
                <TheValtAreaSwitchButton
                    targetArea="portal"
                    label="The Vault Portal"
                    caption="Choose another vault"
                    onClick={leaveNsfwToPortal}
                />
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
            
            <main className={`relative flex-1 overflow-hidden bg-[#05050a] transition-all duration-300 ${isSidebarOpen ? 'md:ml-80' : 'ml-0'}`}>
                <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_18%_8%,rgba(124,58,237,0.16),transparent_32%),radial-gradient(circle_at_86%_16%,rgba(6,182,212,0.1),transparent_28%),linear-gradient(180deg,#05050a_0%,#090912_48%,#05050a_100%)]" />
                <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/10 bg-[#06060c]/80 px-4 py-3 backdrop-blur-xl transition-colors sm:px-6">
                    <div className="flex items-center gap-4">
                        {!isSidebarOpen && (
                            <button 
                                onClick={() => setIsSidebarOpen(true)}
                                className="rounded-xl border border-white/10 bg-white/5 p-2 text-gray-300 transition hover:bg-white/10 hover:text-white"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
                            </button>
                        )}
                        <h1 className="text-base font-black uppercase tracking-[0.18em] text-white sm:text-lg">
                            {view === 'explore' ? 'The Vault NSFW' : 'Personal Collection'}
                        </h1>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <LocalAIStatus compact />
                        <button
                            onClick={() => setView('prompt-lab')}
                            className="hidden sm:inline-flex rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1.5 text-xs font-bold text-violet-400 hover:bg-violet-500/20"
                        >
                            Prompt Lab
                        </button>
                        <button
                            onClick={() => setView('settings')}
                            className="hidden sm:inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-gray-400 hover:text-white"
                        >
                            Settings
                        </button>

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

                <div className="relative z-10 p-4 sm:p-6 lg:p-8">
                    {view === 'explore' ? (
                        <>
                            <GalleryControls
                                currentOptions={searchOptions}
                                query={galleryQuery}
                                resultCount={gridImages.length}
                                isLoading={isLoading}
                                onQueryChange={setGalleryQuery}
                                onSearchSubmit={handleGallerySearchSubmit}
                                onSourceToggle={handleGallerySourceToggle}
                                onContentTypeChange={handleGalleryContentTypeChange}
                                onSortChange={handleGallerySortChange}
                            />
                            {isLoading && gridImages.length === 0 ? (
                                <div className="mt-8">
                                    <GallerySkeleton />
                                </div>
                            ) : (
                                <div className="mt-8">
                                    <ImageGrid images={gridImages} onImageClick={(img) => handleSelectImage(img, gridImages)} />
                                    {gridImages.length === 0 && !isLoading && <EmptyState />}
                                    <Pagination currentPage={currentPage} onPageChange={handlePageChange} hasNextPage={hasMore} />
                                </div>
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

            {selectedGallery && (
                <MangaReaderModal
                    gallery={selectedGallery}
                    onClose={() => setSelectedGallery(null)}
                />
            )}
            
            <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
            <NsfwModal isOpen={isNsfwModalOpen} onConfirm={handleConfirmNsfw} onCancel={handleCancelNsfw} />
            <VaultChatDrawer
                onOpenPromptLab={() => setView('prompt-lab')}
                onOpenComfyUI={() => setView('comfyui')}
            />
            <TheValtAreaSwitchButton
                targetArea="portal"
                label="The Vault Portal"
                caption="Choose another vault"
                onClick={leaveNsfwToPortal}
            />
        </div>
    );
};

const App: React.FC = () => (
    <ThemeProvider>
        <AuthProvider>
            <AIProvider>
                <Suspense fallback={<FullScreenSpinner label="Loading Vault..." />}>
                    <AppContent />
                </Suspense>
            </AIProvider>
        </AuthProvider>
    </ThemeProvider>
);

export default App;
