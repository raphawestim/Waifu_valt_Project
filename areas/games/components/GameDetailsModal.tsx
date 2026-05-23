import React, { useEffect, useState } from 'react';
import { ErrorState } from '../../../shared/components/ErrorState';
import { LoadingState } from '../../../shared/components/LoadingState';
import { getGameDetails } from '../services/rawgService';
import {
  getUserGameByExternalId,
  rawgGameToUserGame,
  saveUserGameHybrid,
  toggleUserGameFavoriteHybrid,
  updateUserGameNotesHybrid,
  updateUserGameStatusHybrid,
} from '../services/userGamesService';
import type { GamePersonalStatus, RawgGame, RawgGameDetails, UserGame } from '../types/games.types';
import { GameStatusSelector, gameStatusLabels } from './GameStatusSelector';
import { SteamEnhancementPanel } from './SteamEnhancementPanel';
import { getGameMetadata, getPreferredGameImage, getSteamLogoUrl } from '../services/steamArtwork';

interface GameDetailsModalProps {
  game: RawgGame | null;
  savedGame?: UserGame;
  userId?: string;
  onClose: () => void;
  onAddToLibrary: (game: RawgGame) => void;
  onLibraryChange: () => void;
}

export const GameDetailsModal: React.FC<GameDetailsModalProps> = ({
  game,
  savedGame,
  userId,
  onClose,
  onAddToLibrary,
  onLibraryChange,
}) => {
  const [details, setDetails] = useState<RawgGameDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState(savedGame?.notes || '');

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

  useEffect(() => {
    setNotes(savedGame?.notes || '');
  }, [savedGame?.notes, game?.id]);

  if (!game) return null;

  const activeSavedGame = userId ? getUserGameByExternalId(userId, 'rawg', String(game.id)) || savedGame : savedGame;

  const ensureSavedGame = async (status: GamePersonalStatus = activeSavedGame?.personalStatus || 'wishlist') => {
    if (!userId) {
      onAddToLibrary(game);
      return null;
    }
    const result = await saveUserGameHybrid(userId, rawgGameToUserGame(userId, details || game, status, activeSavedGame?.isFavorite || false, activeSavedGame || null));
    await onLibraryChange();
    return result.game;
  };

  const handleStatusChange = async (status: GamePersonalStatus) => {
    if (!userId) {
      onAddToLibrary(game);
      return;
    }
    if (!activeSavedGame) {
      await ensureSavedGame(status);
      return;
    }
    await updateUserGameStatusHybrid(userId, activeSavedGame.id, status);
    await onLibraryChange();
  };

  const handleFavorite = async () => {
    if (!userId) {
      onAddToLibrary(game);
      return;
    }
    const existing = activeSavedGame || await ensureSavedGame();
    if (!existing) return;
    await toggleUserGameFavoriteHybrid(userId, existing.id);
    await onLibraryChange();
  };

  const handleSaveNotes = async () => {
    if (!userId) {
      onAddToLibrary(game);
      return;
    }
    const existing = activeSavedGame || await ensureSavedGame();
    if (!existing) return;
    await updateUserGameNotesHybrid(userId, existing.id, notes);
    await onLibraryChange();
  };

  const handleSaveSteamMetadata = async (steamMetadata: NonNullable<ReturnType<typeof getGameMetadata>['steam']>) => {
    if (!userId) {
      onAddToLibrary(game);
      return;
    }
    const existing = activeSavedGame || await ensureSavedGame();
    if (!existing) return;
    await saveUserGameHybrid(userId, {
      ...existing,
      metadata: {
        ...(existing.metadata || {}),
        steam: steamMetadata,
      },
    });
    await onLibraryChange();
  };

  const logoUrl = getSteamLogoUrl(activeSavedGame);
  const heroImage = activeSavedGame ? getPreferredGameImage(activeSavedGame) : game.backgroundImage || game.background_image;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 p-4 backdrop-blur-xl" onClick={onClose}>
      <section className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-3xl border border-white/10 bg-[#090911] text-white shadow-2xl shadow-black" onClick={(event) => event.stopPropagation()}>
        <div className="relative h-72 overflow-hidden rounded-t-3xl bg-white/5">
          {heroImage && <img src={heroImage} alt={game.name} className="h-full w-full object-cover" />}
          <div className="absolute inset-0 bg-gradient-to-t from-[#090911] via-black/20 to-transparent" />
          <button onClick={onClose} className="absolute right-4 top-4 rounded-full border border-white/10 bg-black/50 px-3 py-2 text-xs font-black text-white">
            Close
          </button>
          <div className="absolute bottom-5 left-5 right-5">
            {logoUrl ? (
              <img src={logoUrl} alt={game.name} className="mb-3 max-h-20 max-w-xs object-contain object-left drop-shadow-2xl" />
            ) : (
              <h2 className="text-4xl font-black tracking-tight">{game.name}</h2>
            )}
            <p className="mt-2 text-sm font-bold text-gray-300">{[game.released, `Rating ${game.rating || 'N/A'}`].filter(Boolean).join(' / ')}</p>
          </div>
        </div>
        <div className="space-y-5 p-5 sm:p-6">
          {!details && !error && <LoadingState count={2} />}
          {error && <ErrorState message={error} />}
          {details && (
            <>
              <p className="text-sm leading-7 text-gray-300">{details.description || 'No description available from RAWG.'}</p>

              {details.screenshots && details.screenshots.length > 0 && (
                <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                  {details.screenshots.map((screenshot) => (
                    <img key={screenshot} src={screenshot} alt="" className="h-32 w-56 shrink-0 rounded-2xl border border-white/10 object-cover" loading="lazy" />
                  ))}
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-3">
                <InfoBlock label="Platforms" value={details.platforms.map((item) => item.name).join(', ')} />
                <InfoBlock label="Genres" value={details.genres.map((item) => item.name).join(', ')} />
                <InfoBlock label="Stores" value={details.stores.join(', ') || 'N/A'} />
                <InfoBlock label="Developers" value={details.developers.join(', ') || 'N/A'} />
                <InfoBlock label="Publishers" value={details.publishers.join(', ') || 'N/A'} />
                <InfoBlock label="Metacritic" value={details.metacritic ? String(details.metacritic) : 'N/A'} />
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                <div className="mb-3 flex flex-wrap items-center gap-3">
                  <span className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">Personal Status</span>
                  <GameStatusSelector value={activeSavedGame?.personalStatus || 'wishlist'} onChange={handleStatusChange} />
                  {activeSavedGame && <span className="text-xs font-bold text-cyan-100">{gameStatusLabels[activeSavedGame.personalStatus]}</span>}
                </div>
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Personal notes..."
                  className="min-h-24 w-full rounded-2xl border border-white/10 bg-black/25 p-3 text-sm text-white outline-none placeholder:text-gray-600 focus:border-cyan-300/50"
                />
                <button onClick={handleSaveNotes} className="mt-3 rounded-2xl border border-cyan-300/25 bg-cyan-500/10 px-4 py-2 text-xs font-black text-cyan-100 hover:bg-cyan-500/20">
                  Save Notes
                </button>
              </div>

              <SteamEnhancementPanel
                gameTitle={details.name}
                savedGame={activeSavedGame}
                onSaveSteamMetadata={handleSaveSteamMetadata}
              />

              <div className="flex flex-wrap gap-3">
                <button onClick={() => onAddToLibrary(details)} className="rounded-2xl bg-cyan-500/15 px-5 py-3 text-sm font-black text-cyan-100 hover:bg-cyan-500/25">
                  {activeSavedGame ? 'Update Library' : 'Add to Library'}
                </button>
                <button onClick={handleFavorite} className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-black text-gray-200 hover:bg-white/10">
                  {activeSavedGame?.isFavorite ? 'Favorited' : 'Favorite'}
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
