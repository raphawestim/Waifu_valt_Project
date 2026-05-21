import React, { useEffect, useState } from 'react';
import { BackToPortalButton } from '../../../shared/components/BackToPortalButton';
import { getUserGames, type UserGame } from '../../../shared/storage/userCollectionsService';
import { GameDiscoverySection } from '../components/GameDiscoverySection';
import { UserGamesLibrary } from '../components/UserGamesLibrary';

interface GamesHomeProps {
  isLoggedIn: boolean;
  username?: string;
  onBackToPortal: () => void;
  onEnterTcg: () => void;
  onEnterManga: () => void;
  onEnterNsfw: () => void;
  onLoginClick: () => void;
  userId?: string;
}

export const GamesHome: React.FC<GamesHomeProps> = ({
  isLoggedIn,
  username,
  onBackToPortal,
  onEnterTcg,
  onEnterManga,
  onEnterNsfw,
  onLoginClick,
  userId,
}) => {
  const [gamesLibrary, setGamesLibrary] = useState<UserGame[]>([]);

  useEffect(() => {
    setGamesLibrary(userId ? getUserGames(userId) : []);
  }, [userId]);

  const summaryCards = [
    ['Wishlist', `${gamesLibrary.filter((game) => game.personalStatus === 'wishlist').length} games`],
    ['Playing', `${gamesLibrary.filter((game) => game.personalStatus === 'playing').length} games`],
    ['Finished', `${gamesLibrary.filter((game) => game.personalStatus === 'finished').length} games`],
    ['Completed', `${gamesLibrary.filter((game) => game.personalStatus === 'completed').length} games`],
    ['Platinum', `${gamesLibrary.filter((game) => game.personalStatus === 'platinum').length} games`],
    ['Favorites', `${gamesLibrary.filter((game) => game.isFavorite).length} saved`],
  ];

  return (
    <main className="min-h-screen overflow-hidden bg-[#05050a] text-white selection:bg-cyan-500/30">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_16%_0%,rgba(6,182,212,0.18),transparent_30%),radial-gradient(circle_at_78%_12%,rgba(124,58,237,0.16),transparent_28%),linear-gradient(180deg,#05050a_0%,#07101b_52%,#05050a_100%)]" />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-5 py-6 sm:px-8">
        <header className="flex flex-col gap-5 border-b border-white/10 pb-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <BackToPortalButton onClick={onBackToPortal} tone="cyan" />
            <h1 className="mt-4 text-5xl font-black leading-none tracking-tight text-white sm:text-6xl">Vault Games</h1>
            <p className="mt-4 max-w-3xl text-base leading-8 text-gray-400">
              Discover, track and organize your games with RAWG-powered discovery, dense game grids and a personal progress library.
            </p>
            <p className="mt-2 text-sm font-black uppercase tracking-[0.22em] text-cyan-200/80">
              Discover · Track · Rate · Complete
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-bold text-gray-400">
              {isLoggedIn ? `Logged as ${username}` : 'Guest mode'}
            </span>
            {!isLoggedIn && (
              <button type="button" onClick={onLoginClick} className="rounded-full border border-cyan-300/25 bg-cyan-500/10 px-4 py-2 text-xs font-black text-cyan-100 hover:bg-cyan-500/20">
                Login
              </button>
            )}
            <a href="#games-library" className="rounded-full border border-cyan-300/20 bg-cyan-500/10 px-4 py-2 text-xs font-black text-cyan-100 hover:bg-cyan-500/20">
              My Game Library
            </a>
            <button type="button" onClick={onEnterTcg} className="rounded-full border border-amber-300/20 bg-amber-500/10 px-4 py-2 text-xs font-black text-amber-100 hover:bg-amber-500/20">
              TCG
            </button>
            <button type="button" onClick={onEnterManga} className="rounded-full border border-fuchsia-300/20 bg-fuchsia-500/10 px-4 py-2 text-xs font-black text-fuchsia-100 hover:bg-fuchsia-500/20">
              Manga / Anime
            </button>
            <button type="button" onClick={onEnterNsfw} className="rounded-full border border-rose-300/20 bg-rose-500/10 px-4 py-2 text-xs font-black text-rose-100 hover:bg-rose-500/20">
              NSFW 18+
            </button>
          </div>
        </header>

        <div className="space-y-10 py-8">
          <section className="rounded-3xl border border-cyan-300/15 bg-black/25 p-5 shadow-2xl shadow-black/30 backdrop-blur-xl">
            <h2 className="text-3xl font-black tracking-tight text-white">Discover, track and organize your games.</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-gray-400">
              Browse popular games, trending releases, top rated lists and search results. Save titles to your library with statuses like Wishlist, Playing, Completed and Platinum.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
              {summaryCards.map(([label, value]) => (
                <a key={label} href="#games-library" className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition hover:-translate-y-0.5 hover:border-cyan-300/25 hover:bg-white/[0.06]">
                  <div className="text-sm font-black text-white">{label}</div>
                  <div className="mt-1 text-xs font-bold text-gray-500">{value}</div>
                </a>
              ))}
            </div>
          </section>

          <GameDiscoverySection userId={userId} library={gamesLibrary} onLibraryChange={setGamesLibrary} onLoginRequired={onLoginClick} />
          <UserGamesLibrary userId={userId} games={gamesLibrary} onLibraryChange={setGamesLibrary} />

        </div>
      </div>
    </main>
  );
};
