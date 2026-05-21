import React, { useMemo, useState } from 'react';
import { EmptyState } from '../../../shared/components/EmptyState';
import { SectionHeader } from '../../../shared/components/SectionHeader';
import { deleteUserGame, saveUserGame, type GameLibraryStatus, type UserGame } from '../../../shared/storage/userCollectionsService';
import { GameStatusSelector, gameStatusLabels } from './GameStatusSelector';

interface UserGamesLibraryProps {
  userId?: string;
  games: UserGame[];
  onLibraryChange: (games: UserGame[]) => void;
}

export const UserGamesLibrary: React.FC<UserGamesLibraryProps> = ({ userId, games, onLibraryChange }) => {
  const [statusFilter, setStatusFilter] = useState<GameLibraryStatus | 'all'>('all');
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  const visibleGames = useMemo(() => {
    return games.filter((game) => {
      if (statusFilter !== 'all' && game.personalStatus !== statusFilter) return false;
      if (favoritesOnly && !game.isFavorite) return false;
      return true;
    });
  }, [favoritesOnly, games, statusFilter]);

  return (
    <section id="games-library">
      <SectionHeader
        eyebrow="Games Library"
        title="My Games Library"
        description="Track backlog, wishlist, active games, completions and platform notes."
        tone="cyan"
        action={
          <div className="flex flex-wrap gap-2">
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as GameLibraryStatus | 'all')} className="h-10 rounded-xl border border-white/10 bg-[#080812] px-3 text-xs font-bold text-white">
              <option value="all">All Statuses</option>
              {(Object.keys(gameStatusLabels) as GameLibraryStatus[]).map((status) => <option key={status} value={status}>{gameStatusLabels[status]}</option>)}
            </select>
            <button onClick={() => setFavoritesOnly((value) => !value)} className={`rounded-xl border px-3 py-2 text-xs font-black ${favoritesOnly ? 'border-cyan-300/40 bg-cyan-500/15 text-cyan-100' : 'border-white/10 bg-white/5 text-gray-300'}`}>
              Favorites
            </button>
          </div>
        }
      />
      {visibleGames.length === 0 ? (
        <EmptyState message="No saved games match these filters. Add games from RAWG discovery." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleGames.map((game) => (
            <article key={game.id} className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
              {game.coverUrl && <img src={game.coverUrl} alt={game.title} className="h-40 w-full object-cover" />}
              <div className="space-y-3 p-4">
                <h3 className="text-lg font-black text-white">{game.title}</h3>
                <p className="text-xs text-gray-500">{[game.releaseDate?.slice(0, 4), game.selectedPlatform].filter(Boolean).join(' · ')}</p>
                <GameStatusSelector
                  value={game.personalStatus}
                  onChange={(personalStatus) => userId && onLibraryChange(saveUserGame(userId, { ...game, personalStatus }))}
                />
                <div className="flex gap-3">
                  <button onClick={() => userId && onLibraryChange(saveUserGame(userId, { ...game, isFavorite: !game.isFavorite }))} className="text-xs font-black text-cyan-100">
                    {game.isFavorite ? 'Favorited' : 'Favorite'}
                  </button>
                  <button onClick={() => userId && onLibraryChange(deleteUserGame(userId, game.id))} className="text-xs font-bold text-rose-200">
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
