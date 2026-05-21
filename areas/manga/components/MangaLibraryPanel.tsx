import React, { useMemo, useState } from 'react';
import { EmptyState } from '../../../shared/components/EmptyState';
import { SectionHeader } from '../../../shared/components/SectionHeader';
import { deleteUserMangaItem, saveUserMangaItem, type MangaLibraryStatus, type UserMangaItem } from '../../../shared/storage/userCollectionsService';
import { MangaStatusSelector, mangaStatusLabels } from './MangaStatusSelector';

interface MangaLibraryPanelProps {
  userId?: string;
  items: UserMangaItem[];
  onLibraryChange: (items: UserMangaItem[]) => void;
}

export const MangaLibraryPanel: React.FC<MangaLibraryPanelProps> = ({ userId, items, onLibraryChange }) => {
  const [statusFilter, setStatusFilter] = useState<MangaLibraryStatus | 'all'>('all');

  const visibleItems = useMemo(() => {
    return statusFilter === 'all' ? items : items.filter((item) => item.status === statusFilter);
  }, [items, statusFilter]);

  return (
    <section id="manga-library">
      <SectionHeader
        eyebrow="My Manga Library"
        title="Reading list and favorites"
        description="Save favorites, reading progress, notes and status for safe manga/anime discovery."
        tone="fuchsia"
        action={
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as MangaLibraryStatus | 'all')} className="h-10 rounded-xl border border-white/10 bg-[#080812] px-3 text-xs font-bold text-white">
            <option value="all">All Statuses</option>
            {(Object.keys(mangaStatusLabels) as MangaLibraryStatus[]).map((status) => <option key={status} value={status}>{mangaStatusLabels[status]}</option>)}
          </select>
        }
      />
      {visibleItems.length === 0 ? (
        <EmptyState message="No manga/anime saved yet. Add titles from trending covers or search." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {visibleItems.map((item) => (
            <article key={item.id} className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
              {item.coverUrl && <img src={item.coverUrl} alt={item.title} className="h-64 w-full object-cover object-top" />}
              <div className="space-y-3 p-4">
                <h3 className="line-clamp-2 text-base font-black text-white">{item.title}</h3>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-fuchsia-200">{item.source}</p>
                <MangaStatusSelector value={item.status} onChange={(status) => userId && onLibraryChange(saveUserMangaItem(userId, { ...item, status, isFavorite: status === 'favorite' || item.isFavorite }))} />
                <div className="flex gap-3">
                  <button onClick={() => userId && onLibraryChange(saveUserMangaItem(userId, { ...item, isFavorite: !item.isFavorite, status: !item.isFavorite ? 'favorite' : item.status }))} className="text-xs font-black text-fuchsia-100">
                    {item.isFavorite ? 'Favorited' : 'Favorite'}
                  </button>
                  <button onClick={() => userId && onLibraryChange(deleteUserMangaItem(userId, item.id))} className="text-xs font-bold text-rose-200">
                    Remove
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};
