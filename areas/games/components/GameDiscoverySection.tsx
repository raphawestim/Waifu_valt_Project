import React, { useEffect, useMemo, useState } from 'react';
import { EmptyState } from '../../../shared/components/EmptyState';
import { ErrorState } from '../../../shared/components/ErrorState';
import { LoadingState } from '../../../shared/components/LoadingState';
import { SectionHeader } from '../../../shared/components/SectionHeader';
import { saveUserGame, type GameLibraryStatus, type UserGame } from '../../../shared/storage/userCollectionsService';
import { AddToGameLibraryButton } from './AddToGameLibraryButton';
import { GameDetailsModal } from './GameDetailsModal';
import { GameStatusSelector, gameStatusLabels } from './GameStatusSelector';
import {
  getGenres,
  getPlatforms,
  getPopularGames,
  getRecentlyReleasedGames,
  isRawgConfigured,
  searchGames,
} from '../services/rawgService';
import type { RawgGame, RawgGenre, RawgPlatform } from '../types/games.types';

interface GameDiscoverySectionProps {
  userId?: string;
  library: UserGame[];
  onLibraryChange: (games: UserGame[]) => void;
  onLoginRequired: () => void;
}

export const GameDiscoverySection: React.FC<GameDiscoverySectionProps> = ({
  userId,
  library,
  onLibraryChange,
  onLoginRequired,
}) => {
  const [showcaseGames, setShowcaseGames] = useState<RawgGame[]>([]);
  const [searchResults, setSearchResults] = useState<RawgGame[]>([]);
  const [query, setQuery] = useState('');
  const [genre, setGenre] = useState('');
  const [platform, setPlatform] = useState('');
  const [statusFilter, setStatusFilter] = useState<GameLibraryStatus | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<GameLibraryStatus>('wishlist');
  const [genres, setGenres] = useState<RawgGenre[]>([]);
  const [platforms, setPlatforms] = useState<RawgPlatform[]>([]);
  const [selectedGame, setSelectedGame] = useState<RawgGame | null>(null);
  const [isShowcaseLoading, setIsShowcaseLoading] = useState(false);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const configured = isRawgConfigured();

  useEffect(() => {
    if (!configured) return;
    let isCancelled = false;
    Promise.all([getGenres(), getPlatforms()])
      .then(([nextGenres, nextPlatforms]) => {
        if (!isCancelled) {
          setGenres(nextGenres.slice(0, 18));
          setPlatforms(nextPlatforms.slice(0, 18));
        }
      })
      .catch(() => undefined);
    return () => {
      isCancelled = true;
    };
  }, [configured]);

  useEffect(() => {
    if (!configured) return;
    let isCancelled = false;
    setIsShowcaseLoading(true);
    setError(null);

    Promise.all([
      getRecentlyReleasedGames({ pageSize: 12, genre, platform }),
      getPopularGames({ pageSize: 12, genre, platform, ordering: '-added' }),
    ])
      .then(([recent, popular]) => {
        if (isCancelled) return;
        const merged = [...recent, ...popular].filter((game, index, allGames) => allGames.findIndex((item) => item.id === game.id) === index);
        setShowcaseGames(merged.slice(0, 18));
      })
      .catch(() => {
        if (!isCancelled) {
          setShowcaseGames([]);
          setError('RAWG discovery could not be loaded right now.');
        }
      })
      .finally(() => {
        if (!isCancelled) setIsShowcaseLoading(false);
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
          if (!isCancelled) setError('RAWG search failed.');
        })
        .finally(() => {
          if (!isCancelled) setIsSearchLoading(false);
        });
    }, 420);

    return () => {
      isCancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [configured, genre, platform, query]);

  const libraryByExternalId = useMemo(() => new Map(library.map((game) => [game.externalId, game])), [library]);

  const applyStatusFilter = (games: RawgGame[]) => {
    if (statusFilter === 'all') return games;
    return games.filter((game) => libraryByExternalId.get(String(game.id))?.personalStatus === statusFilter);
  };

  const handleAddToLibrary = (game: RawgGame, favorite = false) => {
    if (!userId) {
      onLoginRequired();
      return;
    }
    const existing = libraryByExternalId.get(String(game.id));
    const timestamp = new Date().toISOString();
    onLibraryChange(saveUserGame(userId, {
      id: existing?.id || `rawg-${game.id}`,
      userId,
      source: 'rawg',
      externalId: String(game.id),
      title: game.name,
      coverUrl: game.backgroundImage,
      platforms: game.platforms.map((item) => item.name),
      selectedPlatform: existing?.selectedPlatform || game.platforms[0]?.name,
      releaseDate: game.released,
      personalStatus: selectedStatus,
      isFavorite: favorite || existing?.isFavorite || false,
      notes: existing?.notes,
      createdAt: existing?.createdAt || timestamp,
      updatedAt: timestamp,
    }));
  };

  const renderGameGrid = (games: RawgGame[]) => (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {applyStatusFilter(games).map((game) => {
        const savedGame = libraryByExternalId.get(String(game.id));
        return (
          <article key={game.id} className="group overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/25">
            <div className="relative h-56 bg-white/5">
              {game.backgroundImage && <img src={game.backgroundImage} alt={game.name} className="h-full w-full object-cover transition group-hover:scale-105" loading="lazy" />}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/15 to-transparent" />
              {savedGame && (
                <span className="absolute left-4 top-4 rounded-full border border-cyan-300/25 bg-black/55 px-3 py-1 text-[10px] font-black text-cyan-100">
                  {gameStatusLabels[savedGame.personalStatus]}
                </span>
              )}
              <div className="absolute bottom-4 left-4 right-4">
                <h3 className="line-clamp-2 text-xl font-black text-white">{game.name}</h3>
                <p className="mt-1 text-xs font-bold text-gray-300">{[game.released?.slice(0, 4), `Rating ${game.rating || 'N/A'}`, game.metacritic ? `MC ${game.metacritic}` : ''].filter(Boolean).join(' · ')}</p>
              </div>
            </div>
            <div className="space-y-3 p-4">
              <p className="text-xs leading-5 text-gray-400">{game.platforms.slice(0, 4).map((item) => item.name).join(' · ') || 'Platforms unavailable'}</p>
              <div className="flex flex-wrap gap-1.5">
                {game.genres.map((item) => (
                  <span key={item.id} className="rounded-full border border-white/10 bg-black/25 px-2 py-1 text-[10px] font-bold text-gray-300">{item.name}</span>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-2">
                <AddToGameLibraryButton game={game} onAdd={handleAddToLibrary} />
                <button onClick={() => handleAddToLibrary(game, true)} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-black text-gray-200 hover:bg-white/10">
                  Favorite
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

  return (
    <section>
      {!configured && <ErrorState message="RAWG API key is not configured. Add VITE_RAWG_API_KEY to .env.local and restart the dev server." />}

      {configured && (
        <div className="space-y-10">
          <section>
            <SectionHeader
              eyebrow="New & Trending"
              title="Fresh games in motion"
              description="Newest and fast-moving RAWG picks are shown first so the page opens directly into discovery."
              tone="cyan"
            />
            <div className="mb-5 grid gap-3 md:grid-cols-[1fr_1fr_1fr]">
              <select value={genre} onChange={(event) => setGenre(event.target.value)} className="h-12 rounded-2xl border border-white/10 bg-[#080812] px-3 text-xs font-bold text-white outline-none">
                <option value="">All Genres</option>
                {genres.map((item) => <option key={item.id} value={item.slug}>{item.name}</option>)}
              </select>
              <select value={platform} onChange={(event) => setPlatform(event.target.value)} className="h-12 rounded-2xl border border-white/10 bg-[#080812] px-3 text-xs font-bold text-white outline-none">
                <option value="">All Platforms</option>
                {platforms.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as GameLibraryStatus | 'all')} className="h-12 rounded-2xl border border-white/10 bg-[#080812] px-3 text-xs font-bold text-white outline-none">
                <option value="all">All Statuses</option>
                {(Object.keys(gameStatusLabels) as GameLibraryStatus[]).map((status) => <option key={status} value={status}>{gameStatusLabels[status]}</option>)}
              </select>
            </div>
            {isShowcaseLoading && <LoadingState count={6} />}
            {error && <ErrorState message={error} />}
            {!isShowcaseLoading && !error && applyStatusFilter(showcaseGames).length === 0 && <EmptyState message="No games matched the current filters." />}
            {!isShowcaseLoading && renderGameGrid(showcaseGames)}
          </section>

          <section>
            <SectionHeader
              eyebrow="Search Games"
              title="Find a title by name"
              description="Search is always enabled now; type a game name and choose the status that should be used when saving."
              tone="cyan"
              action={<GameStatusSelector value={selectedStatus} onChange={setSelectedStatus} />}
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search games by name..."
              className="mb-5 h-14 w-full rounded-2xl border border-cyan-300/20 bg-[#080812] px-4 text-base font-semibold text-white outline-none placeholder:text-gray-600 focus:border-cyan-300/60 focus:ring-4 focus:ring-cyan-500/10"
            />
            {isSearchLoading && <LoadingState count={4} />}
            {!isSearchLoading && query.trim().length < 2 && <EmptyState message="Type at least two characters to search RAWG." />}
            {!isSearchLoading && query.trim().length >= 2 && searchResults.length === 0 && <EmptyState message="No games found for this search." />}
            {!isSearchLoading && renderGameGrid(searchResults)}
          </section>
        </div>
      )}

      <GameDetailsModal game={selectedGame} onClose={() => setSelectedGame(null)} onAddToLibrary={handleAddToLibrary} />
    </section>
  );
};
