import React, { useMemo, useState } from 'react';
import type { MangaMediaItem, UserMangaItem, UserMangaStatus } from '../types/manga.types';
import {
  getUserMangaItemByExternalId,
  loadUserMangaLibrary,
  mediaToUserMangaItem,
  saveUserMangaItemHybrid,
  updateReadingProgressHybrid,
  updateUserMangaStatusHybrid,
} from '../services/userMangaService';
import { MangaStatusSelector } from './MangaStatusSelector';

interface MangaDetailsModalProps {
  item: MangaMediaItem;
  userId?: string;
  onClose: () => void;
  onLoginRequired: () => void;
  onLibraryChange: (items: UserMangaItem[]) => void;
  onStorageWarning?: (message: string) => void;
}

export const MangaDetailsModal: React.FC<MangaDetailsModalProps> = ({ item, userId, onClose, onLoginRequired, onLibraryChange, onStorageWarning }) => {
  const savedItem = useMemo(() => (userId ? getUserMangaItemByExternalId(userId, item.source, item.externalId) : null), [item, userId]);
  const [status, setStatus] = useState<UserMangaStatus>(savedItem?.status || 'want_to_read');
  const [notes, setNotes] = useState(savedItem?.notes || '');
  const [progress, setProgress] = useState(savedItem?.currentChapter || savedItem?.currentEpisode || 0);

  const sync = async () => {
    if (!userId) return;
    const library = await loadUserMangaLibrary(userId);
    if (library.warning) onStorageWarning?.(library.warning);
    onLibraryChange(library.items);
  };

  const saveToLibrary = async (nextStatus = status) => {
    if (!userId) {
      onLoginRequired();
      return;
    }
    const base = getUserMangaItemByExternalId(userId, item.source, item.externalId) || savedItem || mediaToUserMangaItem(userId, item, nextStatus);
    const result = await saveUserMangaItemHybrid(userId, {
      ...base,
      status: nextStatus,
      isFavorite: nextStatus === 'favorite' || base.isFavorite,
      notes,
      currentChapter: item.type === 'manga' ? progress || undefined : base.currentChapter,
      currentEpisode: item.type === 'anime' ? progress || undefined : base.currentEpisode,
    });
    if (result.warning) onStorageWarning?.(result.warning);
    await sync();
  };

  const updateStatus = async (nextStatus: UserMangaStatus) => {
    setStatus(nextStatus);
    if (!userId) return;
    const base = getUserMangaItemByExternalId(userId, item.source, item.externalId) || savedItem || mediaToUserMangaItem(userId, item, nextStatus);
    const saved = await saveUserMangaItemHybrid(userId, base);
    const updated = await updateUserMangaStatusHybrid(userId, saved.item.id, nextStatus);
    if (saved.warning) onStorageWarning?.(saved.warning);
    if (updated.warning) onStorageWarning?.(updated.warning);
    await sync();
  };

  const saveProgress = async () => {
    if (!userId) {
      onLoginRequired();
      return;
    }
    const current = getUserMangaItemByExternalId(userId, item.source, item.externalId) || savedItem;
    const created = current ? null : await saveUserMangaItemHybrid(userId, mediaToUserMangaItem(userId, item, status));
    if (created?.warning) onStorageWarning?.(created.warning);
    const base = current || created?.item;
    if (!base) return;
    const updated = await updateReadingProgressHybrid(userId, base.id, {
      notes,
      currentChapter: item.type === 'manga' ? progress || undefined : base.currentChapter,
      currentEpisode: item.type === 'anime' ? progress || undefined : base.currentEpisode,
    });
    if (updated.warning) onStorageWarning?.(updated.warning);
    await sync();
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-4 backdrop-blur-xl" role="dialog" aria-modal="true" onClick={onClose}>
      <section className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-3xl border border-white/10 bg-[#090911] text-white shadow-2xl shadow-black" onClick={(event) => event.stopPropagation()}>
        {item.bannerUrl && <div className="h-44 bg-cover bg-center opacity-75" style={{ backgroundImage: `linear-gradient(180deg,rgba(0,0,0,0.1),#090911),url(${item.bannerUrl})` }} />}
        <div className="grid gap-5 p-5 md:grid-cols-[15rem_minmax(0,1fr)]">
          {item.coverUrl && <img src={item.coverUrl} alt={item.title} className="-mt-16 w-full rounded-2xl border border-white/10 object-cover shadow-2xl shadow-black md:mt-0" />}
          <div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-fuchsia-200">{item.source} · {item.type}</p>
                <h2 className="mt-2 text-3xl font-black">{item.title}</h2>
                {item.titleNative && <p className="mt-1 text-sm font-bold text-gray-500">{item.titleNative}</p>}
              </div>
              <button onClick={onClose} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-black">Close</button>
            </div>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-gray-300">{item.description || 'No description available.'}</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {[
                ['Score', item.score ? `${item.score}` : '-'],
                ['Status', item.status || '-'],
                ['Year', item.year ? `${item.year}` : '-'],
                ['Chapters', item.chapters ? `${item.chapters}` : '-'],
                ['Episodes', item.episodes ? `${item.episodes}` : '-'],
                ['Format', item.format || '-'],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.035] p-3">
                  <div className="text-[10px] font-black uppercase tracking-[0.16em] text-gray-500">{label}</div>
                  <div className="mt-1 text-sm font-black text-white">{value}</div>
                </div>
              ))}
            </div>
            {item.genres?.length ? <div className="mt-4 flex flex-wrap gap-2">{item.genres.slice(0, 8).map((genre) => <span key={genre} className="rounded-full border border-fuchsia-300/20 bg-fuchsia-500/10 px-3 py-1 text-xs font-bold text-fuchsia-100">{genre}</span>)}</div> : null}
            <div className="mt-5 grid gap-3 md:grid-cols-[12rem_8rem_minmax(0,1fr)]">
              <MangaStatusSelector value={status} onChange={updateStatus} />
              <input type="number" min={0} value={progress} onChange={(event) => setProgress(Number(event.target.value))} className="h-10 rounded-xl border border-white/10 bg-[#080812] px-3 text-xs font-bold text-white outline-none" placeholder="Progress" />
              <input value={notes} onChange={(event) => setNotes(event.target.value)} className="h-10 rounded-xl border border-white/10 bg-[#080812] px-3 text-xs font-bold text-white outline-none" placeholder="Personal note" />
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <button onClick={() => saveToLibrary(status)} className="rounded-2xl bg-fuchsia-500/15 px-5 py-3 text-sm font-black text-fuchsia-100 hover:bg-fuchsia-500/25">Add / Update Library</button>
              <button onClick={() => saveToLibrary('favorite')} className="rounded-2xl border border-fuchsia-300/20 bg-white/5 px-5 py-3 text-sm font-black text-white hover:bg-white/10">Favorite</button>
              <button onClick={saveProgress} className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-black text-gray-200 hover:bg-white/10">Save Progress</button>
              {item.sourceUrl && <a href={item.sourceUrl} target="_blank" rel="noreferrer" className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-black text-gray-200 hover:bg-white/10">Open Source</a>}
            </div>
            <p className="mt-4 text-xs leading-5 text-gray-500">Reader is prepared for future source-permitted chapter delivery. This MVP does not scrape, bypass paywalls or download chapter pages.</p>
          </div>
        </div>
      </section>
    </div>
  );
};
