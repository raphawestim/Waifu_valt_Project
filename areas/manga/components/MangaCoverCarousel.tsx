import React, { useEffect, useState } from 'react';
import { ErrorState } from '../../../shared/components/ErrorState';
import { HorizontalCarousel } from '../../../shared/components/HorizontalCarousel';
import { LoadingState } from '../../../shared/components/LoadingState';
import { SectionHeader } from '../../../shared/components/SectionHeader';
import { mangaResultToLibraryItem, saveUserMangaItem, type MangaLibraryStatus, type UserMangaItem } from '../../../shared/storage/userCollectionsService';
import { getTrendingManga } from '../services/anilistService';
import type { MangaAnimeSearchResult } from '../types/manga.types';

interface MangaCoverCarouselProps {
  userId?: string;
  onLibraryChange: (items: UserMangaItem[]) => void;
  onLoginRequired: () => void;
}

export const MangaCoverCarousel: React.FC<MangaCoverCarouselProps> = ({ userId, onLibraryChange, onLoginRequired }) => {
  const [items, setItems] = useState<MangaAnimeSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);
    getTrendingManga()
      .then((results) => {
        if (!isCancelled) setItems(results);
      })
      .catch(() => {
        if (!isCancelled) setError('Trending manga could not be loaded right now.');
      })
      .finally(() => {
        if (!isCancelled) setIsLoading(false);
      });
    return () => {
      isCancelled = true;
    };
  }, []);

  const handleAdd = (item: MangaAnimeSearchResult, status: MangaLibraryStatus) => {
    if (!userId) {
      onLoginRequired();
      return;
    }
    onLibraryChange(saveUserMangaItem(userId, mangaResultToLibraryItem(userId, item, status)));
  };

  return (
    <section>
      <SectionHeader eyebrow="Featured Manga Covers" title="Trending manga covers" description="AniList-powered manga discovery with cover-first browsing and safe metadata actions." tone="fuchsia" />
      {isLoading && <LoadingState count={4} />}
      {error && <ErrorState message={error} />}
      {!isLoading && !error && (
        <HorizontalCarousel ariaLabel="Trending manga covers carousel" tone="fuchsia">
          {items.map((item) => (
            <article key={item.id} className="w-56 shrink-0 snap-start overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] shadow-xl shadow-black/25">
              {item.imageUrl && <img src={item.imageUrl} alt={item.title} className="h-72 w-full object-cover object-top" loading="lazy" />}
              <div className="space-y-3 p-4">
                <div className="text-[10px] font-black uppercase tracking-[0.16em] text-fuchsia-200">{item.source}</div>
                <h3 className="line-clamp-2 text-base font-black text-white">{item.title}</h3>
                <p className="text-xs font-bold text-gray-500">{[item.year, item.score ? `Score ${item.score}` : ''].filter(Boolean).join(' · ')}</p>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => handleAdd(item, 'want_to_read')} className="rounded-xl bg-fuchsia-500/15 px-3 py-2 text-xs font-black text-fuchsia-100 hover:bg-fuchsia-500/25">
                    Want Read
                  </button>
                  <button onClick={() => handleAdd(item, 'favorite')} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-black text-gray-200 hover:bg-white/10">
                    Favorite
                  </button>
                </div>
              </div>
            </article>
          ))}
        </HorizontalCarousel>
      )}
    </section>
  );
};
