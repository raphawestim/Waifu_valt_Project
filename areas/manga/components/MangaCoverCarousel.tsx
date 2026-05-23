import React, { useEffect, useState } from 'react';
import { ErrorState } from '../../../shared/components/ErrorState';
import { HorizontalCarousel } from '../../../shared/components/HorizontalCarousel';
import { LoadingState } from '../../../shared/components/LoadingState';
import { SectionHeader } from '../../../shared/components/SectionHeader';
import { getTrendingManga } from '../services/anilistService';
import { loadUserMangaLibrary, mediaToUserMangaItem, saveUserMangaItemHybrid } from '../services/userMangaService';
import type { MangaMediaItem, UserMangaItem, UserMangaStatus } from '../types/manga.types';
import { MangaDetailsModal } from './MangaDetailsModal';

interface MangaCoverCarouselProps {
  userId?: string;
  onLibraryChange: (items: UserMangaItem[]) => void;
  onLoginRequired: () => void;
  onStorageWarning?: (message: string) => void;
}

export const MangaCoverCarousel: React.FC<MangaCoverCarouselProps> = ({ userId, onLibraryChange, onLoginRequired, onStorageWarning }) => {
  const [items, setItems] = useState<MangaMediaItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<MangaMediaItem | null>(null);
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

  const handleAdd = async (item: MangaMediaItem, status: UserMangaStatus) => {
    if (!userId) {
      onLoginRequired();
      return;
    }
    const result = await saveUserMangaItemHybrid(userId, mediaToUserMangaItem(userId, item, status));
    if (result.warning) onStorageWarning?.(result.warning);
    const library = await loadUserMangaLibrary(userId);
    if (library.warning) onStorageWarning?.(library.warning);
    onLibraryChange(library.items);
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
              {item.coverUrl && <img src={item.coverUrl} alt={item.title} className="h-72 w-full object-cover object-top" loading="lazy" />}
              <div className="space-y-3 p-4">
                <div className="text-[10px] font-black uppercase tracking-[0.16em] text-fuchsia-200">{item.source}</div>
                <h3 className="line-clamp-2 min-h-[2.5rem] text-base font-black text-white">{item.title}</h3>
                <p className="text-xs font-bold text-gray-500">{[item.year, item.score ? `Score ${item.score}` : ''].filter(Boolean).join(' · ')}</p>
                <div className="grid grid-cols-3 gap-2">
                  <button onClick={() => handleAdd(item, 'want_to_read')} className="rounded-xl bg-fuchsia-500/15 px-2 py-2 text-xs font-black text-fuchsia-100 hover:bg-fuchsia-500/25">Want</button>
                  <button onClick={() => handleAdd(item, 'favorite')} className="rounded-xl border border-white/10 bg-white/5 px-2 py-2 text-xs font-black text-gray-200 hover:bg-white/10">Fav</button>
                  <button onClick={() => setSelectedItem(item)} className="rounded-xl border border-white/10 bg-white/5 px-2 py-2 text-xs font-black text-gray-200 hover:bg-white/10">Details</button>
                </div>
              </div>
            </article>
          ))}
        </HorizontalCarousel>
      )}
      {selectedItem && <MangaDetailsModal item={selectedItem} userId={userId} onClose={() => setSelectedItem(null)} onLoginRequired={onLoginRequired} onLibraryChange={onLibraryChange} onStorageWarning={onStorageWarning} />}
    </section>
  );
};
