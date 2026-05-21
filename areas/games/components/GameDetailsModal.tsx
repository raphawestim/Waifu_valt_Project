import React, { useEffect, useState } from 'react';
import { ErrorState } from '../../../shared/components/ErrorState';
import { LoadingState } from '../../../shared/components/LoadingState';
import type { RawgGame, RawgGameDetails } from '../types/games.types';
import { getGameDetails } from '../services/rawgService';

interface GameDetailsModalProps {
  game: RawgGame | null;
  onClose: () => void;
  onAddToLibrary: (game: RawgGame) => void;
}

export const GameDetailsModal: React.FC<GameDetailsModalProps> = ({ game, onClose, onAddToLibrary }) => {
  const [details, setDetails] = useState<RawgGameDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!game) return;
    let isCancelled = false;
    setDetails(null);
    setError(null);
    getGameDetails(game.id)
      .then((nextDetails) => {
        if (!isCancelled) setDetails(nextDetails);
      })
      .catch(() => {
        if (!isCancelled) setError('Game details could not be loaded.');
      });
    return () => {
      isCancelled = true;
    };
  }, [game]);

  if (!game) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 p-4 backdrop-blur-xl" onClick={onClose}>
      <section className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-white/10 bg-[#090911] text-white shadow-2xl shadow-black" onClick={(event) => event.stopPropagation()}>
        <div className="relative h-64 overflow-hidden rounded-t-3xl bg-white/5">
          {game.backgroundImage && <img src={game.backgroundImage} alt={game.name} className="h-full w-full object-cover" />}
          <div className="absolute inset-0 bg-gradient-to-t from-[#090911] via-black/20 to-transparent" />
          <button onClick={onClose} className="absolute right-4 top-4 rounded-full border border-white/10 bg-black/50 px-3 py-2 text-xs font-black text-white">
            Close
          </button>
          <div className="absolute bottom-5 left-5 right-5">
            <h2 className="text-4xl font-black tracking-tight">{game.name}</h2>
            <p className="mt-2 text-sm font-bold text-gray-300">{[game.released, `Rating ${game.rating || 'N/A'}`].filter(Boolean).join(' · ')}</p>
          </div>
        </div>
        <div className="space-y-5 p-5 sm:p-6">
          {!details && !error && <LoadingState count={2} />}
          {error && <ErrorState message={error} />}
          {details && (
            <>
              <p className="text-sm leading-7 text-gray-300">{details.description || 'No description available from RAWG.'}</p>
              <div className="grid gap-4 md:grid-cols-3">
                <InfoBlock label="Platforms" value={details.platforms.map((item) => item.name).join(', ')} />
                <InfoBlock label="Genres" value={details.genres.map((item) => item.name).join(', ')} />
                <InfoBlock label="Stores" value={details.stores.join(', ') || 'N/A'} />
                <InfoBlock label="Developers" value={details.developers.join(', ') || 'N/A'} />
                <InfoBlock label="Publishers" value={details.publishers.join(', ') || 'N/A'} />
                <InfoBlock label="Metacritic" value={details.metacritic ? String(details.metacritic) : 'N/A'} />
              </div>
              <div className="flex flex-wrap gap-3">
                <button onClick={() => onAddToLibrary(details)} className="rounded-2xl bg-cyan-500/15 px-5 py-3 text-sm font-black text-cyan-100 hover:bg-cyan-500/25">
                  Add to Library
                </button>
                {details.website && (
                  <a href={details.website} target="_blank" rel="noreferrer" className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-black text-gray-200 hover:bg-white/10">
                    Website
                  </a>
                )}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
};

const InfoBlock: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">{label}</div>
    <div className="mt-2 text-sm font-bold leading-6 text-gray-200">{value}</div>
  </div>
);
