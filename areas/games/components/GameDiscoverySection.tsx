import React, { useEffect, useMemo, useState } from 'react';
import { EmptyState } from '../../../shared/components/EmptyState';
import { ErrorState } from '../../../shared/components/ErrorState';
import { LoadingState } from '../../../shared/components/LoadingState';
import { SectionHeader } from '../../../shared/components/SectionHeader';
import {
  getGenres,
  getPlatforms,
  getPopularGames,
  getRecentlyReleasedGames,
  getTopRatedGames,
  isRawgConfigured,
  searchGames,
} from '../services/rawgService';
import { getUserGameByExternalId, loadUserGames, rawgGameToUserGame, saveUserGameHybrid } from '../services/userGamesService';
import type { GamePersonalStatus, RawgGame, RawgGenre, RawgPlatform, UserGame } from '../types/games.types';
import { AddToGameLibraryButton } from './AddToGameLibraryButton';
import { GameDetailsModal } from './GameDetailsModal';
import { GameStatusSelector, gameStatusLabels } from './GameStatusSelector';

interface GameDiscoverySectionProps {
  userId?: string;
  library: UserGame[];
  onLibraryChange: (games: UserGame[]) => void;
  onStorageWarning?: (message: string) => void;
  onLoginRequired: () => void;
}

export const GameDiscoverySection: React.FC<GameDiscoverySectionProps> = ({
  userId,
  library,
  onLibraryChange,
  onStorageWarning,
  onLoginRequired,
}) => {
  const [popularGames, setPopularGames] = useState<RawgGame[]>([]);
  const [trendingGames, setTrendingGames] = useState<RawgGame[]>([]);
  const [recentGames, setRecentGames] = useState<RawgGame[]>([]);
  const [searchResults, setSearchResults] = useState<RawgGame[]>([]);
  const [query, setQuery] = useState('');
  const [genre, setGenre] = useState('');
  const [platform, setPlatform] = useState('');
  const [statusFilter, setStatusFilter] = useState<GamePersonalStatus | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<GamePersonalStatus>('wishlist');
  const [genres, setGenres] = useState<RawgGenre[]>([]);
  const [platforms, setPlatforms] = useState<RawgPlatform[]>([]);
  const [selectedGame, setSelectedGame] = useState<RawgGame | null>(null);
  const [isDiscoveryLoading, setIsDiscoveryLoading] = useState(false);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const configured = isRawgConfigured();
  const libraryByExternalId = useMemo(() => new Map(library.map((game) => [game.externalId, game])), [library]);

  useEffect(() => {
    if (!configured) return;
    let isCancelled = false;
    Promise.all([getGenres(), getPlatforms()])
      .then(([nextGenres, nextPlatforms]) => {
        if (isCancelled) return;
        setGenres(nextGenres.slice(0, 18));
        setPlatforms(nextPlatforms.slice(0, 18));
      })
      .catch(() => undefined);
    return () => {
      isCancelled = true;
    };
  }, [configured]);

  useEffect(() => {
    if (!configured) return;
    let isCancelled = false;
    setIsDiscoveryLoading(true);
    setError(null);

    Promise.all([
      getTopRatedGames({ pageSize: 12, genre, platform }),
      getPopularGames({ pageSize: 18, genre, platform, ordering: '-added' }),
      getRecentlyReleasedGames({ pageSize: 12, genre, platform }),
    ])
      .then(([popular, trending, recent]) => {
        if (isCancelled) return;
        setPopularGames(popular);
        setTrendingGames(trending);
        setRecentGames(recent);
      })
      .catch(() => {
        if (isCancelled) return;
        setPopularGames([]);
        setTrendingGames([]);
        setRecentGames([]);
        setError('RAWG API unavailable or API key missing. Discovery could not be loaded right now.');
      })
      .finally(() => {
        if (!isCancelled) setIsDiscoveryLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [configured, genre, platform]);

  useEffect(() => {
    if (!configured) return;
    const trimmedQuery = query.trim();
    if (trimmedQuery.length < 2) {
      setSearchResults([]);
      setIsSearchLoading(false);
      return;
    }

    let isCancelled = false;
    setIsSearchLoading(true);
    const timeoutId = window.setTimeout(() => {
      searchGames(trimmedQuery, { pageSize: 20, genre, platform })
        .then((results) => {
          if (!isCancelled) setSearchResults(results);
        })
        .catch(() => {
          if (!isCancelled) setError('RAWG search failed. Try again in a moment.');
        })
        .finally(() => {
          if (!isCancelled) setIsSearchLoading(false);
        });
    }, 500);

    return () => {
      isCancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [configured, genre, platform, query]);

  const syncLibrary = async () => {
    if (!userId) return;
    const result = await loadUserGames(userId);
    onLibraryChange(result.games);
    onStorageWarning?.(result.warning || '');
  };

  const applyStatusFilter = (games: RawgGame[]) => {
    if (statusFilter === 'all') return games;
    return games.filter((game) => libraryByExternalId.get(String(game.id))?.personalStatus === statusFilter);
  };

  const handleAddToLibrary = async (game: RawgGame, favorite = false) => {
    if (!userId) {
      onLoginRequired();
      return;
    }
    const existing = getUserGameByExternalId(userId, 'rawg', String(game.id));
    const result = await saveUserGameHybrid(userId, rawgGameToUserGame(userId, game, selectedStatus, favorite, existing));
    onStorageWarning?.(result.warning || '');
    await syncLibrary();
  };

  const renderGameCards = (games: RawgGame[], variant: 'carousel' | 'grid') => {
    const visibleGames = applyStatusFilter(games);
    if (!isDiscoveryLoading && visibleGames.length === 0) {
      return <EmptyState message="No games matched the current filters." />;
    }

    return (
      <div className={variant === 'carousel' ? 'flex gap-4 overflow-x-auto pb-3 no-scrollbar' : 'grid gap-4 md:grid-cols-2 xl:grid-cols-3'}>
        {visibleGames.map((game) => {
          const savedGame = libraryByExternalId.get(String(game.id));
          return (
            <article
              key={game.id}
              className={`${variant === 'carousel' ? 'w-[19rem] shrink-0' : ''} group overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/25`}
            >
              <div className="relative h-56 bg-white/5">
                {(game.backgroundImage || game.background_image) && (
                  <img
                    src={game.backgroundImage || game.background_image}
                    alt={game.name}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                {savedGame && (
                  <span className="absolute left-4 top-4 rounded-full border border-cyan-300/25 bg-black/60 px-3 py-1 text-[10px] font-black text-cyan-100">
                    {gameStatusLabels[savedGame.personalStatus]}
                  </span>
                )}
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="line-clamp-2 text-xl font-black text-white">{game.name}</h3>
                  <p className="mt-1 text-xs font-bold text-gray-300">
                    {[game.released?.slice(0, 4), `Rating ${game.rating || 'N/A'}`, game.metacritic ? `MC ${game.metacritic}` : ''].filter(Boolean).join(' / ')}
                  </p>
                </div>
              </div>
              <div className="space-y-3 p-4">
                <p className="line-clamp-2 text-xs leading-5 text-gray-400">
                  {game.platforms.slice(0, 4).map((item) => item.name).join(' / ') || 'Platforms unavailable'}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {game.genres.slice(0, 4).map((item) => (
                    <span key={item.id} className="rounded-full border border-white/10 bg-black/25 px-2 py-1 text-[10px] font-bold text-gray-300">
                      {item.name}
                    </span>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <AddToGameLibraryButton game={game} savedGame={savedGame} onAdd={handleAddToLibrary} />
                  <button onClick={() => handleAddToLibrary(game, true)} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-black text-gray-200 hover:bg-white/10">
                    {savedGame?.isFavorite ? 'Favorited' : 'Favorite'}
                  </button>
                  <button onClick={() => setSelectedGame(game)} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-black text-gray-200 hover:bg-white/10">
                    Details
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    );
  };

  return (
    <section>
      {!configured && <ErrorState message="RAWG API unavailable or API key missing. Add VITE_RAWG_API_KEY to .env.local and restart the dev server." />}

      {configured && (
        <div className="space-y-10">
          <section>
            <SectionHeader
              eyebrow="Discovery Controls"
              title="Tune the feed"
              description="Filter RAWG discovery by genre, platform and saved status."
              tone="cyan"
            />
            <div className="grid gap-3 md:grid-cols-[1fr_1fr_1fr]">
              <select value={genre} onChange={(event) => setGenre(event.target.value)} className="h-12 rounded-2xl border border-white/10 bg-[#080812] px-3 text-xs font-bold text-white outline-none">
                <option value="">All Genres</option>
                {genres.map((item) => <option key={item.id} value={item.slug}>{item.name}</option>)}
              </select>
              <select value={platform} onChange={(event) => setPlatform(event.target.value)} className="h-12 rounded-2xl border border-white/10 bg-[#080812] px-3 text-xs font-bold text-white outline-none">
                <option value="">All Platforms</option>
                {platforms.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as GamePersonalStatus | 'all')} className="h-12 rounded-2xl border border-white/10 bg-[#080812] px-3 text-xs font-bold text-white outline-none">
                <option value="all">All Saved Statuses</option>
                {(Object.keys(gameStatusLabels) as GamePersonalStatus[]).map((status) => <option key={status} value={status}>{gameStatusLabels[status]}</option>)}
              </select>
            </div>
          </section>

          {error && <ErrorState message={error} />}
          {isDiscoveryLoading && <LoadingState count={6} />}

          {!isDiscoveryLoading && (
            <>
              <section>
                <SectionHeader eyebrow="Popular Right Now" title="Top rated games" description="High-scoring RAWG picks for quick discovery." tone="cyan" />
                {renderGameCards(popularGames, 'carousel')}
              </section>

              <section>
                <SectionHeader eyebrow="New and Trending" title="Games gaining momentum" description="Dense discovery grid ordered by recent additions." tone="cyan" />
                {renderGameCards(trendingGames, 'grid')}
              </section>

              <section>
                <SectionHeader eyebrow="Recently Released" title="Fresh launches" description="Newer games for your backlog radar." tone="cyan" />
                {renderGameCards(recentGames, 'carousel')}
              </section>
            </>
          )}

          <section>
            <SectionHeader
              eyebrow="Search Games"
              title="Find a title by name"
              description="Search uses a 500ms debounce and can save results directly into your library."
              tone="cyan"
              action={<GameStatusSelector value={selectedStatus} onChange={setSelectedStatus} />}
            />
            <div className="mb-5 flex flex-col gap-3 sm:flex-row">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search games by name..."
                className="h-14 min-w-0 flex-1 rounded-2xl border border-cyan-300/20 bg-[#080812] px-4 text-base font-semibold text-white outline-none placeholder:text-gray-600 focus:border-cyan-300/60 focus:ring-4 focus:ring-cyan-500/10"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="h-14 rounded-2xl border border-white/10 bg-white/5 px-5 text-sm font-black text-gray-200 hover:bg-white/10"
                >
                  Clear
                </button>
              )}
            </div>
            {isSearchLoading && <LoadingState count={4} />}
            {!isSearchLoading && query.trim().length < 2 && <EmptyState message="Type at least two characters to search RAWG." />}
            {!isSearchLoading && query.trim().length >= 2 && searchResults.length === 0 && <EmptyState message="No games found for this search." />}
            {!isSearchLoading && searchResults.length > 0 && renderGameCards(searchResults, 'grid')}
          </section>
        </div>
      )}

      <GameDetailsModal
        game={selectedGame}
        savedGame={selectedGame ? libraryByExternalId.get(String(selectedGame.id)) : undefined}
        onClose={() => setSelectedGame(null)}
        onAddToLibrary={handleAddToLibrary}
        onLibraryChange={syncLibrary}
        userId={userId}
      />
    </section>
  );
};
