import React, { useMemo, useState } from 'react';
import { EmptyState } from '../../../shared/components/EmptyState';
import { SectionHeader } from '../../../shared/components/SectionHeader';
import {
  deleteUserGameHybrid,
  loadUserGames,
  toggleUserGameFavoriteHybrid,
  updateUserGameStatusHybrid,
} from '../services/userGamesService';
import type { GamePersonalStatus, UserGame } from '../types/games.types';
import { GameStatusSelector, gameStatusLabels } from './GameStatusSelector';
import { getPreferredGameImage, getSteamLogoUrl } from '../services/steamArtwork';

interface UserGamesLibraryProps {
  userId?: string;
  games: UserGame[];
  onLibraryChange: (games: UserGame[]) => void;
  onStorageWarning?: (message: string) => void;
}

export const UserGamesLibrary: React.FC<UserGamesLibraryProps> = ({ userId, games, onLibraryChange, onStorageWarning }) => {
  const [statusFilter, setStatusFilter] = useState<GamePersonalStatus | 'all'>('all');
  const [platformFilter, setPlatformFilter] = useState('');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [search, setSearch] = useState('');

  const platforms = useMemo(
    () => Array.from(new Set(games.flatMap((game) => game.platforms))).filter(Boolean).sort(),
    [games],
  );

  const visibleGames = useMemo(() => {
    return games.filter((game) => {
      if (statusFilter !== 'all' && game.personalStatus !== statusFilter) return false;
      if (platformFilter && !game.platforms.includes(platformFilter)) return false;
      if (favoritesOnly && !game.isFavorite) return false;
      if (search.trim() && !game.title.toLowerCase().includes(search.trim().toLowerCase())) return false;
      return true;
    });
  }, [favoritesOnly, games, platformFilter, search, statusFilter]);

  const refresh = async () => {
    if (!userId) return;
    const result = await loadUserGames(userId);
    onLibraryChange(result.games);
    onStorageWarning?.(result.warning || '');
  };

  return (
    <section id="games-library">
      <SectionHeader
        eyebrow="Games Library"
        title="My Games Library"
        description="Track backlog, wishlist, active games, completions, favorites and platform notes."
        tone="cyan"
      />

      {!userId ? (
        <EmptyState message="Login to save games into your personal library." />
      ) : (
        <>
          <div className="mb-5 grid gap-3 md:grid-cols-[1fr_0.7fr_0.7fr_auto]">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search your library..."
              className="h-11 rounded-2xl border border-white/10 bg-[#080812] px-3 text-sm font-semibold text-white outline-none placeholder:text-gray-600 focus:border-cyan-300/50"
            />
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as GamePersonalStatus | 'all')} className="h-11 rounded-2xl border border-white/10 bg-[#080812] px-3 text-xs font-bold text-white">
              <option value="all">All Statuses</option>
              {(Object.keys(gameStatusLabels) as GamePersonalStatus[]).map((status) => <option key={status} value={status}>{gameStatusLabels[status]}</option>)}
            </select>
            <select value={platformFilter} onChange={(event) => setPlatformFilter(event.target.value)} className="h-11 rounded-2xl border border-white/10 bg-[#080812] px-3 text-xs font-bold text-white">
              <option value="">All Platforms</option>
              {platforms.map((platform) => <option key={platform} value={platform}>{platform}</option>)}
            </select>
            <button onClick={() => setFavoritesOnly((value) => !value)} className={`rounded-2xl border px-4 py-2 text-xs font-black ${favoritesOnly ? 'border-cyan-300/40 bg-cyan-500/15 text-cyan-100' : 'border-white/10 bg-white/5 text-gray-300'}`}>
              Favorites
            </button>
          </div>

          {visibleGames.length === 0 ? (
            <EmptyState message="No saved games match these filters. Add games from RAWG discovery." />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {visibleGames.map((game) => (
                <article key={game.id} className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
                  {getPreferredGameImage(game) && <img src={getPreferredGameImage(game)} alt={game.title} className="h-40 w-full object-cover" />}
                  <div className="space-y-3 p-4">
                    <div>
                      {getSteamLogoUrl(game) ? (
                        <img src={getSteamLogoUrl(game)} alt={game.title} className="mb-2 max-h-10 max-w-44 object-contain object-left" loading="lazy" />
                      ) : (
                        <h3 className="line-clamp-2 text-lg font-black text-white">{game.title}</h3>
                      )}
                      <p className="mt-1 text-xs text-gray-500">{[game.releaseDate?.slice(0, 4), game.selectedPlatform].filter(Boolean).join(' / ')}</p>
                    </div>
                    <GameStatusSelector
                      value={game.personalStatus}
                      onChange={async (personalStatus) => {
                        const result = await updateUserGameStatusHybrid(userId, game.id, personalStatus);
                        onStorageWarning?.(result.warning || '');
                        await refresh();
                      }}
                    />
                    {game.notes && <p className="line-clamp-2 text-xs leading-5 text-gray-500">{game.notes}</p>}
                    <div className="flex gap-3">
                      <button
                        onClick={async () => {
                          const result = await toggleUserGameFavoriteHybrid(userId, game.id);
                          onStorageWarning?.(result.warning || '');
                          await refresh();
                        }}
                        className="text-xs font-black text-cyan-100"
                      >
                        {game.isFavorite ? 'Favorited' : 'Favorite'}
                      </button>
                      <button
                        onClick={async () => {
                          const result = await deleteUserGameHybrid(userId, game.id);
                          onStorageWarning?.(result.warning || '');
                          await refresh();
                        }}
                        className="text-xs font-bold text-rose-200"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
};
