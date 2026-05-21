import React, { useEffect, useMemo, useState } from 'react';
import { searchAniList } from '../services/anilistService';
import { searchJikan } from '../services/jikanService';
import { MangaResultCard } from './MangaResultCard';
import type { MangaAnimeSearchResult } from '../types/manga.types';

type MangaSearchSource = 'anilist' | 'jikan';

const sourceLabels: Record<MangaSearchSource, string> = {
  anilist: 'AniList',
  jikan: 'Jikan',
};

export const MangaQuickSearch: React.FC = () => {
  const [source, setSource] = useState<MangaSearchSource>('anilist');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MangaAnimeSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const helperText = useMemo(() => {
    if (source === 'jikan') return 'Jikan searches MyAnimeList-backed anime and manga metadata with debounce.';
    return 'AniList GraphQL search returns anime and manga metadata, covers, status and popularity signals.';
  }, [source]);

  useEffect(() => {
    const trimmedQuery = query.trim();
    setError(null);

    if (trimmedQuery.length < 2) {
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
  }, [query, source]);

  return (
    <section className="rounded-3xl border border-fuchsia-300/15 bg-black/30 p-5 shadow-2xl shadow-black/35 backdrop-blur-xl sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
        <div className="flex-1">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-fuchsia-200">Quick Search</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-white">Search active manga/anime APIs</h2>
          <p className="mt-2 text-sm leading-6 text-gray-400">{helperText}</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-[13rem_1fr] lg:min-w-[34rem]">
          <select
            value={source}
            onChange={(event) => setSource(event.target.value as MangaSearchSource)}
            className="h-12 rounded-2xl border border-white/10 bg-[#080812] px-4 text-sm font-bold text-white outline-none focus:border-fuchsia-300/50"
          >
            {(Object.keys(sourceLabels) as MangaSearchSource[]).map((sourceId) => (
              <option key={sourceId} value={sourceId}>
                {sourceLabels[sourceId]}
              </option>
            ))}
          </select>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Try Frieren, One Piece, Evangelion..."
            className="h-12 rounded-2xl border border-white/10 bg-[#080812] px-4 text-sm font-semibold text-white outline-none transition placeholder:text-gray-600 focus:border-fuchsia-300/60 focus:ring-4 focus:ring-fuchsia-500/10"
          />
        </div>
      </div>

      <div className="mt-5">
        {isLoading && <p className="text-sm font-semibold text-fuchsia-100">Searching...</p>}
        {error && <p className="text-sm font-semibold text-rose-200">{error}</p>}
        {!isLoading && !error && query.trim().length >= 2 && results.length === 0 && (
          <p className="text-sm font-semibold text-gray-500">No results found.</p>
        )}

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {results.map((result) => (
            <MangaResultCard key={result.id} result={result} />
          ))}
        </div>
      </div>
    </section>
  );
};
