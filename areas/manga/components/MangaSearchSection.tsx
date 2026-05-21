import React, { useEffect, useMemo, useState } from 'react';
import { EmptyState } from '../../../shared/components/EmptyState';
import { ErrorState } from '../../../shared/components/ErrorState';
import { SectionHeader } from '../../../shared/components/SectionHeader';
import { mangaResultToLibraryItem, saveUserMangaItem, type MangaLibraryStatus, type UserMangaItem } from '../../../shared/storage/userCollectionsService';
import { searchAniList } from '../services/anilistService';
import { searchJikan } from '../services/jikanService';
import type { MangaAnimeSearchResult } from '../types/manga.types';
import { AddToMangaLibraryButton } from './AddToMangaLibraryButton';
import { MangaResultCard } from './MangaResultCard';
import { MangaStatusSelector } from './MangaStatusSelector';

type MangaSearchSource = 'anilist' | 'jikan' | 'mangadex' | 'kitsu';

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
}

export const MangaSearchSection: React.FC<MangaSearchSectionProps> = ({ userId, onLibraryChange, onLoginRequired }) => {
  const [source, setSource] = useState<MangaSearchSource>('anilist');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<MangaLibraryStatus>('want_to_read');
  const [results, setResults] = useState<MangaAnimeSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const plannedSource = source === 'mangadex' || source === 'kitsu';
  const helperText = useMemo(() => {
    if (source === 'jikan') return 'Jikan searches MyAnimeList-backed anime and manga metadata.';
    if (plannedSource) return `${sourceLabels[source]} is visible as planned metadata integration.`;
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
        const nextResults = source === 'anilist' ? await searchAniList(trimmedQuery) : await searchJikan(trimmedQuery);
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
  }, [plannedSource, query, source]);

  const handleAdd = (item: MangaAnimeSearchResult, nextStatus: MangaLibraryStatus) => {
    if (!userId) {
      onLoginRequired();
      return;
    }
    onLibraryChange(saveUserMangaItem(userId, mangaResultToLibraryItem(userId, item, nextStatus)));
  };

  return (
    <section id="search-manga">
      <SectionHeader eyebrow="Search Manga / Anime" title="Discover titles and save them" description={helperText} tone="fuchsia" />
      <div className="mb-5 grid gap-3 lg:grid-cols-[12rem_1fr_12rem]">
        <select value={source} onChange={(event) => setSource(event.target.value as MangaSearchSource)} className="h-12 rounded-2xl border border-white/10 bg-[#080812] px-4 text-sm font-bold text-white outline-none">
          {(Object.keys(sourceLabels) as MangaSearchSource[]).map((sourceId) => <option key={sourceId} value={sourceId}>{sourceLabels[sourceId]}</option>)}
        </select>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search manga/anime..." className="h-12 rounded-2xl border border-white/10 bg-[#080812] px-4 text-sm font-semibold text-white outline-none placeholder:text-gray-600" />
        <MangaStatusSelector value={status} onChange={setStatus} />
      </div>
      {plannedSource && <EmptyState message={`${sourceLabels[source]} is planned. This MVP keeps it metadata-safe until the adapter is expanded.`} />}
      {isLoading && <p className="text-sm font-semibold text-fuchsia-100">Searching...</p>}
      {error && <ErrorState message={error} />}
      {!plannedSource && !isLoading && !error && query.trim().length >= 2 && results.length === 0 && <EmptyState message="No results found." />}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {results.map((item) => (
          <div key={item.id} className="space-y-2">
            <MangaResultCard result={item} />
            <AddToMangaLibraryButton item={item} status={status} onAdd={handleAdd} />
          </div>
        ))}
      </div>
    </section>
  );
};
