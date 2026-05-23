import React, { useState } from 'react';
import { ApiHttpError } from '../../../shared/services/apiClient';
import {
  getSteamStoreUrl,
  searchSteamApps,
} from '../services/steamClient';
import {
  getSteamGridDbGrids,
  getSteamGridDbHeroes,
  getSteamGridDbLogos,
  searchSteamGridDbGames,
} from '../services/steamGridDbClient';
import { getGameMetadata } from '../services/steamArtwork';
import type {
  SteamAppSearchResult,
  SteamGameMetadata,
  SteamGridDbArtwork,
  SteamGridDbGame,
  UserGame,
} from '../types/games.types';

interface SteamEnhancementPanelProps {
  gameTitle: string;
  savedGame?: UserGame | null;
  onSaveSteamMetadata: (metadata: SteamGameMetadata) => Promise<void>;
}

export const SteamEnhancementPanel: React.FC<SteamEnhancementPanelProps> = ({
  gameTitle,
  savedGame,
  onSaveSteamMetadata,
}) => {
  const [steamApps, setSteamApps] = useState<SteamAppSearchResult[]>([]);
  const [gridGames, setGridGames] = useState<SteamGridDbGame[]>([]);
  const [grids, setGrids] = useState<SteamGridDbArtwork[]>([]);
  const [heroes, setHeroes] = useState<SteamGridDbArtwork[]>([]);
  const [logos, setLogos] = useState<SteamGridDbArtwork[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingArtwork, setIsLoadingArtwork] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const steamMetadata = getGameMetadata(savedGame).steam || {};

  const saveMetadata = async (patch: SteamGameMetadata) => {
    await onSaveSteamMetadata({
      ...steamMetadata,
      ...patch,
      preferredArtworkSource: patch.preferredArtworkSource || steamMetadata.preferredArtworkSource || 'steamgriddb',
    });
  };

  const handleSearch = async () => {
    setIsSearching(true);
    setError(null);
    try {
      const [apps, gridDbGames] = await Promise.all([
        searchSteamApps(gameTitle),
        searchSteamGridDbGames(gameTitle).catch((searchError) => {
          if (searchError instanceof ApiHttpError && searchError.message.includes('SteamGridDB API key')) {
            setError('SteamGridDB API key is not configured.');
          }
          return [];
        }),
      ]);
      setSteamApps(apps.slice(0, 6));
      setGridGames(gridDbGames.slice(0, 6));
    } catch (searchError) {
      setError(searchError instanceof Error ? searchError.message : 'Steam search failed.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSteamApp = async (app: SteamAppSearchResult) => {
    const store = await getSteamStoreUrl(app.id);
    await saveMetadata({
      appId: String(app.id),
      storeUrl: store.storeUrl,
    });
  };

  const handleSelectGridGame = async (game: SteamGridDbGame) => {
    setIsLoadingArtwork(true);
    setError(null);
    await saveMetadata({ gridDbGameId: String(game.id) });
    try {
      const [nextGrids, nextHeroes, nextLogos] = await Promise.all([
        getSteamGridDbGrids(game.id),
        getSteamGridDbHeroes(game.id),
        getSteamGridDbLogos(game.id),
      ]);
      setGrids(nextGrids.slice(0, 8));
      setHeroes(nextHeroes.slice(0, 6));
      setLogos(nextLogos.slice(0, 6));
      if (nextGrids.length === 0 && nextHeroes.length === 0 && nextLogos.length === 0) {
        setError('No SteamGridDB artwork found for this game.');
      }
    } catch (artworkError) {
      setError(artworkError instanceof Error ? artworkError.message : 'SteamGridDB artwork could not be loaded.');
    } finally {
      setIsLoadingArtwork(false);
    }
  };

  return (
    <section className="rounded-2xl border border-cyan-300/15 bg-cyan-500/[0.04] p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-200">Steam Enhancement</p>
          <h3 className="mt-1 text-lg font-black text-white">{steamMetadata.appId ? 'Steam app linked' : 'Steam not linked'}</h3>
          {steamMetadata.storeUrl && (
            <a href={steamMetadata.storeUrl} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs font-bold text-cyan-100 hover:text-white">
              Open Steam Store
            </a>
          )}
        </div>
        <button
          onClick={handleSearch}
          disabled={isSearching}
          className="rounded-2xl border border-cyan-300/25 bg-cyan-500/10 px-4 py-2 text-xs font-black text-cyan-100 hover:bg-cyan-500/20 disabled:opacity-50"
        >
          {isSearching ? 'Searching Steam...' : 'Enhance with Steam'}
        </button>
      </div>

      {error && <p className="mt-3 rounded-2xl border border-amber-300/20 bg-amber-500/10 p-3 text-xs font-bold text-amber-50">{error}</p>}

      {steamApps.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-xs font-black uppercase tracking-[0.16em] text-gray-500">Steam app matches</p>
          <div className="grid gap-2 md:grid-cols-2">
            {steamApps.map((app) => (
              <button
                key={app.id}
                onClick={() => handleSelectSteamApp(app)}
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/25 p-3 text-left hover:border-cyan-300/30"
              >
                {app.tiny_image && <img src={app.tiny_image} alt="" className="h-10 w-10 rounded-lg object-cover" />}
                <span>
                  <span className="block text-sm font-black text-white">{app.name}</span>
                  <span className="text-xs font-bold text-gray-500">App ID {app.id}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {gridGames.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-xs font-black uppercase tracking-[0.16em] text-gray-500">SteamGridDB matches</p>
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {gridGames.map((game) => (
              <button
                key={game.id}
                onClick={() => handleSelectGridGame(game)}
                className="min-w-44 rounded-2xl border border-white/10 bg-black/25 p-3 text-left text-sm font-black text-white hover:border-cyan-300/30"
              >
                {game.name}
                <span className="mt-1 block text-xs text-gray-500">GridDB {game.id}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {isLoadingArtwork && <p className="mt-3 text-xs font-bold text-cyan-100">Loading artworks...</p>}

      <ArtworkPicker title="Cover / Grid" items={grids} onSelect={(item) => saveMetadata({ coverUrl: item.url })} />
      <ArtworkPicker title="Hero" items={heroes} onSelect={(item) => saveMetadata({ heroUrl: item.url })} wide />
      <ArtworkPicker title="Logo" items={logos} onSelect={(item) => saveMetadata({ logoUrl: item.url })} />
    </section>
  );
};

const ArtworkPicker: React.FC<{
  title: string;
  items: SteamGridDbArtwork[];
  wide?: boolean;
  onSelect: (item: SteamGridDbArtwork) => void;
}> = ({ title, items, wide, onSelect }) => {
  if (items.length === 0) return null;
  return (
    <div className="mt-4">
      <p className="mb-2 text-xs font-black uppercase tracking-[0.16em] text-gray-500">{title}</p>
      <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
        {items.map((item) => (
          <button key={item.id} onClick={() => onSelect(item)} className="group relative shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-black/25 hover:border-cyan-300/40">
            <img src={item.thumb || item.url} alt="" className={`${wide ? 'h-28 w-56' : 'h-40 w-28'} object-cover transition group-hover:scale-105`} loading="lazy" />
            <span className="absolute bottom-2 left-2 rounded-full bg-black/70 px-2 py-1 text-[10px] font-black text-white">Select</span>
          </button>
        ))}
      </div>
    </div>
  );
};
