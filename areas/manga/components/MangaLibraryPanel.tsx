import React, { useMemo, useState } from 'react';
import { EmptyState } from '../../../shared/components/EmptyState';
import { SectionHeader } from '../../../shared/components/SectionHeader';
import {
  deleteUserMangaItemHybrid,
  loadUserMangaLibrary,
  toggleUserMangaFavoriteHybrid,
  updateReadingProgressHybrid,
  updateUserMangaStatusHybrid,
} from '../services/userMangaService';
import type { MangaSource, MediaType, UserMangaItem, UserMangaStatus } from '../types/manga.types';
import { MangaStatusSelector, mangaStatusLabels } from './MangaStatusSelector';

interface MangaLibraryPanelProps {
  userId?: string;
  items: UserMangaItem[];
  onLibraryChange: (items: UserMangaItem[]) => void;
  onStorageWarning?: (message: string) => void;
}

export const MangaLibraryPanel: React.FC<MangaLibraryPanelProps> = ({ userId, items, onLibraryChange, onStorageWarning }) => {
  const [statusFilter, setStatusFilter] = useState<UserMangaStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<MediaType | 'all'>('all');
  const [sourceFilter, setSourceFilter] = useState<MangaSource | 'all'>('all');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [search, setSearch] = useState('');

  const visibleItems = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return items.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (typeFilter !== 'all' && item.type !== typeFilter) return false;
      if (sourceFilter !== 'all' && item.source !== sourceFilter) return false;
      if (favoritesOnly && !item.isFavorite && item.status !== 'favorite') return false;
      if (normalized && !item.title.toLowerCase().includes(normalized)) return false;
      return true;
    });
  }, [favoritesOnly, items, search, sourceFilter, statusFilter, typeFilter]);

  const refresh = async () => {
    if (!userId) return;
    const library = await loadUserMangaLibrary(userId);
    if (library.warning) onStorageWarning?.(library.warning);
    onLibraryChange(library.items);
  };

  const updateStatus = async (itemId: string, status: UserMangaStatus) => {
    if (!userId) return;
    const result = await updateUserMangaStatusHybrid(userId, itemId, status);
    if (result.warning) onStorageWarning?.(result.warning);
    await refresh();
  };

  const toggleFavorite = async (itemId: string) => {
    if (!userId) return;
    const result = await toggleUserMangaFavoriteHybrid(userId, itemId);
    if (result.warning) onStorageWarning?.(result.warning);
    await refresh();
  };

  const updateProgress = async (item: UserMangaItem, value: number) => {
    if (!userId) return;
    const result = await updateReadingProgressHybrid(userId, item.id, item.type === 'anime' ? { currentEpisode: value } : { currentChapter: value });
    if (result.warning) onStorageWarning?.(result.warning);
    await refresh();
  };

  const remove = async (itemId: string) => {
    if (!userId) return;
    const result = await deleteUserMangaItemHybrid(userId, itemId);
    if (result.warning) onStorageWarning?.(result.warning);
    await refresh();
  };

  return (
    <section id="manga-library">
      <SectionHeader eyebrow="My Manga Library" title="Reading list and favorites" description="Save favorites, reading progress, notes and status for safe manga/anime discovery." tone="fuchsia" />
      <div className="mb-5 grid gap-3 md:grid-cols-[minmax(0,1fr)_10rem_10rem_10rem_8rem]">
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search your library..." className="h-10 rounded-xl border border-white/10 bg-[#080812] px-3 text-xs font-bold text-white outline-none" />
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as UserMangaStatus | 'all')} className="h-10 rounded-xl border border-white/10 bg-[#080812] px-3 text-xs font-bold text-white">
          <option value="all">All Statuses</option>
          {(Object.keys(mangaStatusLabels) as UserMangaStatus[]).map((status) => <option key={status} value={status}>{mangaStatusLabels[status]}</option>)}
        </select>
        <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as MediaType | 'all')} className="h-10 rounded-xl border border-white/10 bg-[#080812] px-3 text-xs font-bold text-white">
          <option value="all">All Types</option>
          <option value="manga">Manga</option>
          <option value="anime">Anime</option>
        </select>
        <select value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value as MangaSource | 'all')} className="h-10 rounded-xl border border-white/10 bg-[#080812] px-3 text-xs font-bold text-white">
          <option value="all">All Sources</option>
          <option value="anilist">AniList</option>
          <option value="jikan">Jikan</option>
          <option value="mangadex">MangaDex</option>
        </select>
        <button onClick={() => setFavoritesOnly((value) => !value)} className={`rounded-xl border px-3 py-2 text-xs font-black ${favoritesOnly ? 'border-fuchsia-300/30 bg-fuchsia-500/20 text-fuchsia-100' : 'border-white/10 bg-white/5 text-gray-300'}`}>Favorites</button>
      </div>
      {visibleItems.length === 0 ? (
        <EmptyState message="No manga/anime saved yet. Add titles from trending covers or search." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {visibleItems.map((item) => (
            <article key={item.id} className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
              {item.coverUrl && <img src={item.coverUrl} alt={item.title} className="h-64 w-full object-cover object-top" />}
              <div className="space-y-3 p-4">
                <h3 className="line-clamp-2 text-base font-black text-white">{item.title}</h3>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-fuchsia-200">{item.source} · {item.type}</p>
                <MangaStatusSelector value={item.status} onChange={(status) => updateStatus(item.id, status)} />
                <input
                  type="number"
                  min={0}
                  value={item.type === 'anime' ? item.currentEpisode || 0 : item.currentChapter || 0}
                  onChange={(event) => updateProgress(item, Number(event.target.value))}
                  className="h-10 w-full rounded-xl border border-white/10 bg-[#080812] px-3 text-xs font-bold text-white outline-none"
                  placeholder={item.type === 'anime' ? 'Episode' : 'Chapter'}
                />
                <div className="flex gap-3">
                  <button onClick={() => toggleFavorite(item.id)} className="text-xs font-black text-fuchsia-100">{item.isFavorite ? 'Favorited' : 'Favorite'}</button>
                  <button onClick={() => remove(item.id)} className="text-xs font-bold text-rose-200">Remove</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};
