import React, { useEffect, useMemo, useState } from 'react';
import { EmptyState } from '../../../shared/components/EmptyState';
import { ErrorState } from '../../../shared/components/ErrorState';
import { LoadingState } from '../../../shared/components/LoadingState';
import { SectionHeader } from '../../../shared/components/SectionHeader';
import { searchAniListMedia } from '../services/anilistService';
import { searchJikanAnime, searchJikanManga } from '../services/jikanService';
import { searchMangaDexManga } from '../services/mangadexService';
import { loadUserMangaLibrary, mediaToUserMangaItem, saveUserMangaItemHybrid } from '../services/userMangaService';
import type { MangaMediaItem, MangaSource, MediaType, UserMangaItem, UserMangaStatus } from '../types/manga.types';
import { AddToMangaLibraryButton } from './AddToMangaLibraryButton';
import { MangaDetailsModal } from './MangaDetailsModal';
import { MangaStatusSelector } from './MangaStatusSelector';

type MangaSearchSource = Exclude<MangaSource, 'custom'>;

const sourceLabels: Record<MangaSearchSource, string> = {
  anilist: 'AniList',
  jikan: 'Jikan',
  mangadex: 'MangaDex',
  kitsu: 'Kitsu',
};

interface MangaSearchSectionProps {
  userId?: string;
  onLibraryChange: (items: UserMangaItem[]) => void;
  onLoginRequired: () => void;
  onStorageWarning?: (message: string) => void;
}

export const MangaSearchSection: React.FC<MangaSearchSectionProps> = ({ userId, onLibraryChange, onLoginRequired, onStorageWarning }) => {
  const [source, setSource] = useState<MangaSearchSource>('anilist');
  const [type, setType] = useState<MediaType>('manga');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<UserMangaStatus>('want_to_read');
  const [results, setResults] = useState<MangaMediaItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<MangaMediaItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const plannedSource = source === 'kitsu';
  const helperText = useMemo(() => {
    if (source === 'jikan') return 'Jikan searches MyAnimeList-backed anime and manga metadata. It can rate-limit, so searches are debounced.';
    if (source === 'mangadex') return 'MangaDex is enabled for metadata and chapter discovery only. Reader delivery remains source-limited.';
    if (plannedSource) return `${sourceLabels[source]} is visible as a planned JSON:API metadata integration.`;
    return 'AniList GraphQL search returns manga/anime metadata, covers, genres and popularity signals.';
  }, [plannedSource, source]);

  useEffect(() => {
    const trimmedQuery = query.trim();
    setError(null);
    if (trimmedQuery.length < 2 || plannedSource) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    let isCancelled = false;
    setIsLoading(true);
    const timeoutId = window.setTimeout(async () => {
      try {
        let nextResults: MangaMediaItem[] = [];
        if (source === 'anilist') nextResults = await searchAniListMedia(trimmedQuery, type);
        if (source === 'jikan') nextResults = type === 'anime' ? await searchJikanAnime(trimmedQuery) : await searchJikanManga(trimmedQuery);
        if (source === 'mangadex') nextResults = await searchMangaDexManga(trimmedQuery);
        if (!isCancelled) setResults(nextResults);
      } catch (caughtError) {
        if (!isCancelled) {
          setResults([]);
          setError(caughtError instanceof Error ? caughtError.message : 'Search failed.');
        }
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    }, 520);

    return () => {
      isCancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [plannedSource, query, source, type]);

  const handleAdd = async (item: MangaMediaItem, nextStatus: UserMangaStatus) => {
    if (!userId) {
      onLoginRequired();
      return;
    }
    const result = await saveUserMangaItemHybrid(userId, mediaToUserMangaItem(userId, item, nextStatus));
    if (result.warning) onStorageWarning?.(result.warning);
    const library = await loadUserMangaLibrary(userId);
    if (library.warning) onStorageWarning?.(library.warning);
    onLibraryChange(library.items);
  };

  return (
    <section id="search-manga" className="rounded-3xl border border-white/10 bg-black/20 p-5">
      <SectionHeader eyebrow="Search Manga / Anime" title="Discover titles and save them" description={helperText} tone="fuchsia" />
      <div className="mb-5 grid gap-3 lg:grid-cols-[10rem_10rem_1fr_12rem]">
        <select value={source} onChange={(event) => setSource(event.target.value as MangaSearchSource)} className="h-12 rounded-2xl border border-white/10 bg-[#080812] px-4 text-sm font-bold text-white outline-none">
          {(Object.keys(sourceLabels) as MangaSearchSource[]).map((sourceId) => <option key={sourceId} value={sourceId}>{sourceLabels[sourceId]}</option>)}
        </select>
        <select value={type} onChange={(event) => setType(event.target.value as MediaType)} disabled={source === 'mangadex'} className="h-12 rounded-2xl border border-white/10 bg-[#080812] px-4 text-sm font-bold text-white outline-none disabled:opacity-50">
          <option value="manga">Manga</option>
          <option value="anime">Anime</option>
        </select>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search manga/anime..." className="h-12 rounded-2xl border border-white/10 bg-[#080812] px-4 text-sm font-semibold text-white outline-none placeholder:text-gray-600" />
        <MangaStatusSelector value={status} onChange={setStatus} />
      </div>
      {plannedSource && <EmptyState message={`${sourceLabels[source]} is planned. This MVP keeps it metadata-safe until the adapter is expanded.`} />}
      {isLoading && <LoadingState count={4} />}
      {error && <ErrorState message={error} />}
      {!plannedSource && !isLoading && !error && query.trim().length >= 2 && results.length === 0 && <EmptyState message="No results found." />}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {results.map((item) => (
          <article key={item.id} className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] shadow-xl shadow-black/20">
            {item.coverUrl && <img src={item.coverUrl} alt={item.title} className="h-72 w-full object-cover object-top" />}
            <div className="space-y-3 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-fuchsia-200">{item.source} · {item.type}</p>
              <h3 className="line-clamp-2 min-h-[2.5rem] text-base font-black text-white">{item.title}</h3>
              <p className="line-clamp-2 text-xs font-semibold text-gray-500">{item.description || [item.year, item.score ? `Score ${item.score}` : ''].filter(Boolean).join(' · ')}</p>
              <div className="grid grid-cols-2 gap-2">
                <AddToMangaLibraryButton item={item} status={status} onAdd={handleAdd} />
                <button onClick={() => setSelectedItem(item)} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-black text-gray-200 hover:bg-white/10">Details</button>
              </div>
            </div>
          </article>
        ))}
      </div>
      {selectedItem && <MangaDetailsModal item={selectedItem} userId={userId} onClose={() => setSelectedItem(null)} onLoginRequired={onLoginRequired} onLibraryChange={onLibraryChange} onStorageWarning={onStorageWarning} />}
    </section>
  );
};
