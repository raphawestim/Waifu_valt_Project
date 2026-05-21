import React, { useEffect, useMemo, useState } from 'react';
import { searchPokemon } from '../services/pokeApiService';
import { searchScryfallCards } from '../services/scryfallService';
import type { GameQuickSearchResult } from '../types/games.types';

type GameSearchSource = 'scryfall' | 'pokeapi';

const sourceLabels: Record<GameSearchSource, string> = {
  scryfall: 'Scryfall',
  pokeapi: 'PokeAPI',
};

export const GameQuickSearch: React.FC = () => {
  const [source, setSource] = useState<GameSearchSource>('scryfall');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GameQuickSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const helperText = useMemo(() => {
    if (source === 'pokeapi') return 'PokeAPI MVP uses exact Pokemon names, like pikachu or charizard.';
    return 'Search MTG cards by name, color, type or Scryfall query syntax.';
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
        const nextResults =
          source === 'scryfall'
            ? (await searchScryfallCards(trimmedQuery)).map((result) => ({ ...result, source } as const))
            : (await searchPokemon(trimmedQuery)).map((result) => ({ ...result, source } as const));

        if (!isCancelled) setResults(nextResults);
      } catch (caughtError) {
        if (!isCancelled) {
          setResults([]);
          setError(caughtError instanceof Error ? caughtError.message : 'Search failed.');
        }
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    }, 420);

    return () => {
      isCancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [query, source]);

  return (
    <section className="rounded-3xl border border-cyan-300/15 bg-black/30 p-5 shadow-2xl shadow-black/35 backdrop-blur-xl sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
        <div className="flex-1">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-200">Quick Search</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-white">Search active game APIs</h2>
          <p className="mt-2 text-sm leading-6 text-gray-400">{helperText}</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-[13rem_1fr] lg:min-w-[34rem]">
          <select
            value={source}
            onChange={(event) => setSource(event.target.value as GameSearchSource)}
            className="h-12 rounded-2xl border border-white/10 bg-[#080812] px-4 text-sm font-bold text-white outline-none focus:border-cyan-300/50"
          >
            {(Object.keys(sourceLabels) as GameSearchSource[]).map((sourceId) => (
              <option key={sourceId} value={sourceId}>
                {sourceLabels[sourceId]}
              </option>
            ))}
          </select>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={source === 'scryfall' ? 'Try black lotus, dragon, c:r...' : 'Try pikachu...'}
            className="h-12 rounded-2xl border border-white/10 bg-[#080812] px-4 text-sm font-semibold text-white outline-none transition placeholder:text-gray-600 focus:border-cyan-300/60 focus:ring-4 focus:ring-cyan-500/10"
          />
        </div>
      </div>

      <div className="mt-5">
        {isLoading && <p className="text-sm font-semibold text-cyan-100">Searching...</p>}
        {error && <p className="text-sm font-semibold text-rose-200">{error}</p>}
        {!isLoading && !error && query.trim().length >= 2 && results.length === 0 && (
          <p className="text-sm font-semibold text-gray-500">No results found.</p>
        )}

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {results.map((result) => (
            <article key={`${result.source}-${result.id}`} className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
              {'imageUrl' in result && result.imageUrl && (
                <img src={result.imageUrl} alt={result.name} className="h-56 w-full object-cover object-top" loading="lazy" />
              )}
              {'spriteUrl' in result && result.spriteUrl && (
                <div className="flex h-48 items-center justify-center bg-gradient-to-br from-cyan-500/10 to-violet-500/10">
                  <img src={result.spriteUrl} alt={result.name} className="h-40 w-40 object-contain" loading="lazy" />
                </div>
              )}
              <div className="p-4">
                <div className="text-xs font-black uppercase tracking-[0.16em] text-cyan-200">{sourceLabels[result.source]}</div>
                <h3 className="mt-1 text-base font-black capitalize text-white">{result.name}</h3>
                {'typeLine' in result && <p className="mt-1 text-xs font-bold text-gray-500">{result.typeLine}</p>}
                {'types' in result && <p className="mt-1 text-xs font-bold capitalize text-gray-500">{result.types.join(' / ')}</p>}
                {'oracleText' in result && result.oracleText && <p className="mt-3 line-clamp-4 text-xs leading-5 text-gray-400">{result.oracleText}</p>}
                {'abilities' in result && (
                  <p className="mt-3 text-xs leading-5 text-gray-400">Abilities: {result.abilities.slice(0, 3).join(', ')}</p>
                )}
                <a href={result.sourceUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex text-xs font-black uppercase tracking-[0.14em] text-cyan-200 hover:text-cyan-100">
                  Open source
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};
