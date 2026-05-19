import React, { useState, useEffect } from 'react';
import type { SearchOptions, WaifuImage } from '../types';
import { useAuth } from '../context/AuthContext';
import { Navbar } from './Navbar';
import { HeroCarousel } from './HeroCarousel';
import { ContentRow } from './ContentRow';
import { ImageCard } from './ImageCard';
import { searchImages, getRandomImages } from '../services/imageService';
import { r34videoService } from '../services/r34videoService';
import { hhService } from '../services/hhService';
import { nhentaiService } from '../services/nhentaiService';
import { FullScreenSpinner } from './Spinner';
import { R34VideoCard } from './R34VideoCard';
import { MangaCard } from './MangaCard';
import { HHAnimeCard } from './HHAnimeCard';

type HomeFilter = 'all' | 'videos' | 'images' | 'doujin' | 'hentai';

interface HomeViewProps {
    currentOptions: SearchOptions;
    onSearchSubmit: (options: SearchOptions) => void;
    onRequestNsfw: (onConfirm: () => void, onCancel: () => void) => void;
    onAuthRequest: () => void;
    onImageClick?: (image: any, collection: any[]) => void;
    onNavigateHome?: () => void;
    onNavigateComfyUI?: () => void;
    onNavigateArtists?: () => void;
    onNavigateCharacters?: () => void;
    onNavigateMetadata?: () => void;
    onNavigateProfile?: () => void;
    onSelectVideo?: (video: any) => void;
    onSelectGallery?: (gallery: any) => void;
    onSelectAnime?: (anime: any) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ 
    currentOptions, 
    onSearchSubmit, 
    onAuthRequest, 
    onNavigateHome, 
    onNavigateProfile,
    onImageClick,
    onSelectVideo,
    onSelectGallery,
    onSelectAnime
}) => {
    const { user } = useAuth();
    const [activeFilter, setActiveFilter] = useState<HomeFilter>('all');
    const [heroImages, setHeroImages] = useState<WaifuImage[]>([]);
    const [trendingDanbooru, setTrendingDanbooru] = useState<WaifuImage[]>([]);
    const [rule34Recent, setRule34Recent] = useState<WaifuImage[]>([]);
    const [waifuIm, setWaifuIm] = useState<WaifuImage[]>([]);
    const [gelbooruRandom, setGelbooruRandom] = useState<WaifuImage[]>([]);
    const [recentVideos, setRecentVideos] = useState<any[]>([]);
    const [recentAnime, setRecentAnime] = useState<any[]>([]);
    const [recentDoujins, setRecentDoujins] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isCancelled = false;
        let videoHighlights: any[] = [];
        let animeHighlights: any[] = [];

        const buildHeroHighlights = (): WaifuImage[] => {
            const highlights: WaifuImage[] = [];

            if (videoHighlights[0]) {
                highlights.push({
                    id: `hero-v-${videoHighlights[0].id}`,
                    thumbnailUrl: videoHighlights[0].thumbnail,
                    fullUrl: videoHighlights[0].thumbnail,
                    tags: ['Video', 'Rule34Video'],
                    artist: 'R34Video',
                    sourceApi: 'rule34' as any,
                    type: 'video',
                    rating: 'explicit',
                    width: 1280,
                    height: 720,
                    score: 0
                });
            }

            if (animeHighlights[0]) {
                highlights.push({
                    id: `hero-a-${animeHighlights[0].id}`,
                    thumbnailUrl: animeHighlights[0].thumbnail,
                    fullUrl: animeHighlights[0].thumbnail,
                    tags: ['Anime', 'HentaiHaven'],
                    artist: 'HentaiHaven',
                    sourceApi: 'waifu.im' as any,
                    type: 'video',
                    rating: 'explicit',
                    width: 1280,
                    height: 720,
                    score: 0
                });
            }

            return highlights;
        };

        const updateHeroHighlights = () => {
            if (isCancelled) return;
            const highlights = buildHeroHighlights();
            if (highlights.length === 0) return;

            setHeroImages(prev => [
                ...highlights,
                ...prev.filter(img => !img.id.startsWith('hero-'))
            ].slice(0, 6));
        };

        const fetchAll = async () => {
            setIsLoading(true);
            setHeroImages([]);
            setTrendingDanbooru([]);
            setRule34Recent([]);
            setWaifuIm([]);
            setGelbooruRandom([]);
            setRecentVideos([]);
            setRecentAnime([]);
            setRecentDoujins([]);

            setIsLoading(false);

            getRandomImages(5, { ...currentOptions, sources: ['waifu.im'], isNsfwEnabled: true })
                .then(images => {
                    if (!isCancelled) setHeroImages(images);
                })
                .catch(error => console.error("Error fetching hero images:", error));

            searchImages({ ...currentOptions, query: 'order:score', limit: 20, sources: ['danbooru'], isNsfwEnabled: true }, 1)
                .then(images => {
                    if (!isCancelled) setTrendingDanbooru(images);
                })
                .catch(error => console.error("Error fetching Danbooru highlights:", error));

            searchImages({ ...currentOptions, query: '', limit: 20, sources: ['rule34'], isNsfwEnabled: true }, 1)
                .then(images => {
                    if (!isCancelled) setRule34Recent(images);
                })
                .catch(error => console.error("Error fetching Rule34 images:", error));

            searchImages({ ...currentOptions, query: 'waifu', limit: 20, sources: ['waifu.im'], isNsfwEnabled: true }, 1)
                .then(images => {
                    if (!isCancelled) setWaifuIm(images);
                })
                .catch(error => console.error("Error fetching Waifu.im images:", error));

            getRandomImages(20, { ...currentOptions, sources: ['gelbooru'], isNsfwEnabled: true })
                .then(images => {
                    if (!isCancelled) setGelbooruRandom(images);
                })
                .catch(error => console.error("Error fetching Gelbooru images:", error));

            r34videoService.getLatestVideos(1)
                .then(data => {
                    if (isCancelled) return;
                    videoHighlights = data?.results || [];
                    setRecentVideos(videoHighlights);
                    updateHeroHighlights();
                })
                .catch(error => console.error("Error fetching latest videos:", error));

            hhService.getLatest(1)
                .then(data => {
                    if (isCancelled) return;
                    animeHighlights = data?.results || [];
                    setRecentAnime(animeHighlights);
                    updateHeroHighlights();
                })
                .catch(error => console.error("Error fetching latest anime:", error));

            nhentaiService.getNewUploads(1)
                .then(data => {
                    if (!isCancelled) setRecentDoujins(data?.result || []);
                })
                .catch(error => console.error("Error fetching latest doujins:", error));
        };

        fetchAll();

        return () => {
            isCancelled = true;
        };
    }, [currentOptions]);

    const shouldShow = (section: HomeFilter) => activeFilter === 'all' || activeFilter === section;
    const isInitialContentEmpty = trendingDanbooru.length === 0 && recentVideos.length === 0 && recentAnime.length === 0 && recentDoujins.length === 0;
    const filters: Array<{ id: HomeFilter; label: string }> = [
        { id: 'all', label: 'All' },
        { id: 'videos', label: 'Videos' },
        { id: 'images', label: 'Images' },
        { id: 'doujin', label: 'Doujin' },
        { id: 'hentai', label: 'Hentai' },
    ];

    const HomeSkeleton = () => (
        <div className="px-4 md:px-12 space-y-8">
            {[0, 1, 2].map(row => (
                <div key={row} className="space-y-3">
                    <div className="h-7 w-56 rounded-full bg-white/10 animate-pulse" />
                    <div className="flex gap-3 overflow-hidden">
                        {[0, 1, 2, 3, 4].map(item => (
                            <div key={item} className="h-44 w-[280px] flex-none rounded-2xl border border-white/10 bg-white/5 animate-pulse" />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <div className="w-full min-h-screen relative flex flex-col overflow-hidden bg-[#05050a] text-white">
            <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_18%_10%,rgba(124,58,237,0.18),transparent_32%),radial-gradient(circle_at_82%_20%,rgba(14,165,233,0.12),transparent_28%),linear-gradient(180deg,#05050a_0%,#090912_48%,#05050a_100%)]" />
            <Navbar 
                onSearch={(q) => onSearchSubmit({ ...currentOptions, query: q })}
                onToggleSidebar={() => {}}
                onAuthClick={onAuthRequest}
                onLogoClick={onNavigateHome || (() => {})}
                onNavigate={(v) => {
                    if (v === 'home' && onNavigateHome) onNavigateHome();
                    if (v === 'explore') onSearchSubmit({ ...currentOptions, query: '' });
                    if (v === 'profile' && onNavigateProfile) onNavigateProfile();
                }}
                isLoggedIn={!!user}
                currentView="home"
            />
            
            {heroImages.length > 0 ? (
                <HeroCarousel 
                    images={heroImages} 
                    onExploreClick={() => onSearchSubmit({ ...currentOptions, query: '' })} 
                    onPlayClick={(img) => {
                        if (img.id.startsWith('hero-v-')) {
                            const vId = img.id.replace('hero-v-', '');
                            const video = recentVideos.find(v => v.id.toString() === vId);
                            if (video && onSelectVideo) onSelectVideo(video);
                        } else if (img.id.startsWith('hero-a-')) {
                            const aId = img.id.replace('hero-a-', '');
                            const anime = recentAnime.find(a => a.id.toString() === aId);
                            if (anime && onSelectAnime) onSelectAnime(anime);
                        } else {
                            onImageClick?.(img, heroImages);
                        }
                    }} 
                />
            ) : (
                <div className="h-[92vh] min-h-[620px] bg-[#05050a] flex items-center justify-center">
                    {isLoading && <FullScreenSpinner label="Loading Vault Dashboard..." />}
                </div>
            )}
            
            <div className="-mt-24 sm:-mt-36 relative z-10 pb-24">
                <div className="sticky top-[72px] z-30 mb-8 border-y border-white/10 bg-[#05050a]/72 px-4 py-3 backdrop-blur-2xl md:px-12">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <h2 className="text-sm font-black uppercase tracking-[0.26em] text-violet-200">Explore Vault</h2>
                            <p className="mt-1 text-xs text-gray-500">Fast lanes for every local craving.</p>
                        </div>
                        <div className="flex gap-2 overflow-x-auto no-scrollbar">
                            {filters.map(filter => (
                                <button
                                    key={filter.id}
                                    onClick={() => setActiveFilter(filter.id)}
                                    className={`whitespace-nowrap rounded-full border px-4 py-2 text-xs font-black uppercase tracking-wider transition ${
                                        activeFilter === filter.id
                                            ? 'border-violet-300/40 bg-violet-500 text-white shadow-[0_0_28px_rgba(139,92,246,0.35)]'
                                            : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20 hover:text-white'
                                    }`}
                                >
                                    {filter.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {isInitialContentEmpty && <HomeSkeleton />}

                {shouldShow('images') && (
                    <ContentRow 
                        title="Trending Now" 
                        subtitle="High-signal Danbooru picks with premium visual density."
                        items={trendingDanbooru} 
                        renderItem={img => <ImageCard image={img} onClick={() => onImageClick?.(img, trendingDanbooru)} isStandard />} 
                    />
                )}
                
                {shouldShow('videos') && recentVideos.length > 0 && (
                    <ContentRow 
                        title="Latest Rule34 Videos" 
                        subtitle="Landscape previews, duration, views and quick play on hover."
                        items={recentVideos} 
                        variant="landscape"
                        renderItem={video => <R34VideoCard video={video} onClick={() => onSelectVideo?.(video)} />} 
                    />
                )}

                {shouldShow('hentai') && recentAnime.length > 0 && (
                    <ContentRow 
                        title="HentaiHaven Recent Anime" 
                        subtitle="Fresh anime episodes and studio releases."
                        items={recentAnime} 
                        variant="wide"
                        renderItem={anime => <HHAnimeCard anime={anime} onClick={() => onSelectAnime?.(anime)} />} 
                    />
                )}

                {shouldShow('doujin') && recentDoujins.length > 0 && (
                    <ContentRow 
                        title="New Doujin Releases" 
                        subtitle="Latest galleries with quick access to reader mode."
                        items={recentDoujins} 
                        renderItem={gallery => <MangaCard gallery={gallery} onClick={() => onSelectGallery?.(gallery)} />} 
                    />
                )}

                {shouldShow('images') && (
                    <ContentRow 
                        title="Rule34 Latest Images" 
                        subtitle="Recent image drops with fast Prompt Lab actions."
                        items={rule34Recent} 
                        renderItem={img => <ImageCard image={img} onClick={() => onImageClick?.(img, rule34Recent)} isStandard />} 
                    />
                )}
                
                {shouldShow('images') && (
                    <ContentRow 
                        title="Curated by Waifu.im" 
                        subtitle="Clean high-quality picks for fast browsing."
                        items={waifuIm} 
                        renderItem={img => <ImageCard image={img} onClick={() => onImageClick?.(img, waifuIm)} isStandard />} 
                    />
                )}
                
                {shouldShow('images') && (
                    <ContentRow 
                        title="Gelbooru Random Selection" 
                        subtitle="A visual shuffle for discovery and inspiration."
                        items={gelbooruRandom} 
                        renderItem={img => <ImageCard image={img} onClick={() => onImageClick?.(img, gelbooruRandom)} isStandard />} 
                    />
                )}
            </div>
        </div>
    );
};
