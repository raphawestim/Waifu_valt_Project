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
        const fetchAll = async () => {
            setIsLoading(true);
            try {
                const isNsfw = true;
                
                // Base fetches
                const fetchPromises: Promise<any>[] = [
                    getRandomImages(5, { ...currentOptions, sources: ['danbooru', 'waifu.im'], isNsfwEnabled: true }),
                    searchImages({ ...currentOptions, query: 'order:score', limit: 20, sources: ['danbooru'], isNsfwEnabled: true }, 1),
                    searchImages({ ...currentOptions, query: '', limit: 20, sources: ['rule34'], isNsfwEnabled: true }, 1),
                    searchImages({ ...currentOptions, query: 'waifu', limit: 20, sources: ['waifu.im'], isNsfwEnabled: true }, 1),
                    getRandomImages(20, { ...currentOptions, sources: ['gelbooru'], isNsfwEnabled: true }),
                    r34videoService.getLatestVideos(1),
                    hhService.getLatest(1),
                    nhentaiService.getNewUploads(1)
                ];

                const results = await Promise.all(fetchPromises);
                
                setHeroImages(results[0]);
                setTrendingDanbooru(results[1]);
                setRule34Recent(results[2]);
                setWaifuIm(results[3]);
                setGelbooruRandom(results[4]);

                if (isNsfw && results.length >= 8) {
                    const videoData = results[5]?.results || [];
                    const animeData = results[6]?.results || [];
                    const doujinData = results[7]?.result || [];

                    setRecentVideos(videoData);
                    setRecentAnime(animeData);
                    setRecentDoujins(doujinData);

                    // Mix some highlights into Hero if NSFW
                    if (videoData.length > 0 || animeData.length > 0) {
                        const highlights: WaifuImage[] = [];
                        
                        if (videoData[0]) {
                            highlights.push({
                                id: `hero-v-${videoData[0].id}`,
                                thumbnailUrl: videoData[0].thumbnail,
                                fullUrl: videoData[0].thumbnail, // Just for display
                                tags: ['Video', 'Rule34Video'],
                                artist: 'R34Video',
                                sourceApi: 'rule34' as any,
                                type: 'video',
                                rating: 'explicit',
                                width: 1280, height: 720, score: 0
                            });
                        }
                        
                        if (animeData[0]) {
                            highlights.push({
                                id: `hero-a-${animeData[0].id}`,
                                thumbnailUrl: animeData[0].thumbnail,
                                fullUrl: animeData[0].thumbnail,
                                tags: ['Anime', 'HentaiHaven'],
                                artist: 'HentaiHaven',
                                sourceApi: 'waifu.im' as any, // fallback type
                                type: 'video',
                                rating: 'explicit',
                                width: 1280, height: 720, score: 0
                            });
                        }

                        if (highlights.length > 0) {
                            setHeroImages(prev => [...highlights, ...prev].slice(0, 6));
                        }
                    }
                }
            } catch (error) {
                console.error("Error fetching dashboard content:", error);
            }
            setIsLoading(false);
        };

        fetchAll();
    }, [currentOptions.isNsfwEnabled]);

    if (isLoading) {
        return <div className="min-h-screen bg-[#141414]"><FullScreenSpinner label="Loading Vault Dashboard..." /></div>;
    }

    return (
        <div className="w-full min-h-screen relative flex flex-col bg-[#141414] overflow-hidden">
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
            
            <div className="-mt-16 sm:-mt-32 relative z-10 space-y-8 pb-24">
                <ContentRow 
                    title="Danbooru Highlights" 
                    items={trendingDanbooru} 
                    renderItem={img => <ImageCard image={img} onClick={() => onImageClick?.(img, trendingDanbooru)} isStandard />} 
                />
                
                {recentVideos.length > 0 && (
                    <ContentRow 
                        title="Latest Rule34 Videos" 
                        items={recentVideos} 
                        renderItem={video => <R34VideoCard video={video} onClick={() => onSelectVideo?.(video)} />} 
                    />
                )}

                {recentAnime.length > 0 && (
                    <ContentRow 
                        title="HentaiHaven Recent Anime" 
                        items={recentAnime} 
                        renderItem={anime => <HHAnimeCard anime={anime} onClick={() => onSelectAnime?.(anime)} />} 
                    />
                )}

                {recentDoujins.length > 0 && (
                    <ContentRow 
                        title="New Doujin Releases" 
                        items={recentDoujins} 
                        renderItem={gallery => <MangaCard gallery={gallery} onClick={() => onSelectGallery?.(gallery)} />} 
                    />
                )}

                <ContentRow 
                    title="Rule34 Latest Images" 
                    items={rule34Recent} 
                    renderItem={img => <ImageCard image={img} onClick={() => onImageClick?.(img, rule34Recent)} isStandard />} 
                />
                
                <ContentRow 
                    title="Curated by Waifu.im" 
                    items={waifuIm} 
                    renderItem={img => <ImageCard image={img} onClick={() => onImageClick?.(img, waifuIm)} isStandard />} 
                />
                
                <ContentRow 
                    title="Gelbooru Random Selection" 
                    items={gelbooruRandom} 
                    renderItem={img => <ImageCard image={img} onClick={() => onImageClick?.(img, gelbooruRandom)} isStandard />} 
                />
            </div>
        </div>
    );
};
