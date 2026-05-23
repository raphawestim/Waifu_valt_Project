import React, { useEffect, useState } from 'react';
import { BackToPortalButton } from '../../../shared/components/BackToPortalButton';
import { MangaCoverCarousel } from '../components/MangaCoverCarousel';
import { MangaLibraryPanel } from '../components/MangaLibraryPanel';
import { MangaSearchSection } from '../components/MangaSearchSection';
import { getUserMangaStats, loadUserMangaLibrary } from '../services/userMangaService';
import type { MangaLibraryStats, UserMangaItem } from '../types/manga.types';

interface MangaAnimeHomeProps {
  isLoggedIn: boolean;
  username?: string;
  onBackToPortal: () => void;
  onEnterGames: () => void;
  onEnterNsfw: () => void;
  onLoginClick: () => void;
  userId?: string;
}

const emptyStats: MangaLibraryStats = {
  total: 0,
  favorites: 0,
  reading: 0,
  wantToRead: 0,
  completed: 0,
  paused: 0,
  dropped: 0,
};

export const MangaAnimeHome: React.FC<MangaAnimeHomeProps> = ({
  isLoggedIn,
  username,
  onBackToPortal,
  onEnterGames,
  onEnterNsfw,
  onLoginClick,
  userId,
}) => {
  const [library, setLibrary] = useState<UserMangaItem[]>([]);
  const [storageMode, setStorageMode] = useState<'backend' | 'local'>('local');
  const [storageWarning, setStorageWarning] = useState('');

  useEffect(() => {
    let cancelled = false;
    if (!userId) {
      setLibrary([]);
      setStorageMode('local');
      setStorageWarning('');
      return;
    }
    loadUserMangaLibrary(userId).then((result) => {
      if (cancelled) return;
      setLibrary(result.items);
      setStorageMode(result.storage);
      setStorageWarning(result.warning || '');
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const stats = userId ? getUserMangaStats(userId) : emptyStats;

  return (
    <main className="min-h-screen overflow-hidden bg-[#05050a] text-white selection:bg-fuchsia-500/30">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(217,70,239,0.18),transparent_30%),radial-gradient(circle_at_82%_14%,rgba(124,58,237,0.18),transparent_28%),linear-gradient(180deg,#05050a_0%,#14081a_52%,#05050a_100%)]" />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-5 py-6 sm:px-8">
        <header className="flex flex-col gap-5 border-b border-white/10 pb-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <BackToPortalButton onClick={onBackToPortal} tone="fuchsia" />
            <h1 className="mt-4 text-5xl font-black leading-none tracking-tight text-white sm:text-6xl">The Vault Manga / Anime</h1>
            <p className="mt-2 text-sm font-black uppercase tracking-[0.22em] text-fuchsia-200/80">Manga · Anime · Reading · Library</p>
            <p className="mt-4 max-w-3xl text-base leading-8 text-gray-400">
              Explore manga and anime metadata, favorite covers, manage your reading list and track your progress.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-bold text-gray-400">
              {isLoggedIn ? `Logged as ${username}` : 'Guest mode'}
            </span>
            {isLoggedIn && (
              <span className="rounded-full border border-fuchsia-300/20 bg-fuchsia-500/10 px-3 py-2 text-xs font-black text-fuchsia-100">
                Library: {storageMode === 'backend' ? 'Backend' : 'Local'}
              </span>
            )}
            {!isLoggedIn && (
              <button type="button" onClick={onLoginClick} className="rounded-full border border-fuchsia-300/25 bg-fuchsia-500/10 px-4 py-2 text-xs font-black text-fuchsia-100 hover:bg-fuchsia-500/20">
                Login
              </button>
            )}
            <a href="#manga-library" className="rounded-full border border-fuchsia-300/25 bg-fuchsia-500/10 px-4 py-2 text-xs font-black text-fuchsia-100 hover:bg-fuchsia-500/20">My Library</a>
            <a href="#manga-library" className="rounded-full border border-violet-300/25 bg-violet-500/10 px-4 py-2 text-xs font-black text-violet-100 hover:bg-violet-500/20">Favorites</a>
            <a href="#search-manga" className="rounded-full border border-cyan-300/20 bg-cyan-500/10 px-4 py-2 text-xs font-black text-cyan-100 hover:bg-cyan-500/20">Search Manga</a>
            <button type="button" onClick={onEnterGames} className="rounded-full border border-cyan-300/20 bg-cyan-500/10 px-4 py-2 text-xs font-black text-cyan-100 hover:bg-cyan-500/20">Games</button>
            <button type="button" onClick={onEnterNsfw} className="rounded-full border border-rose-300/20 bg-rose-500/10 px-4 py-2 text-xs font-black text-rose-100 hover:bg-rose-500/20">NSFW 18+</button>
          </div>
        </header>

        <div className="space-y-10 py-8">
          <div className="grid gap-3 md:grid-cols-4 xl:grid-cols-6">
            {[
              ['Reading', `${stats.reading} active`],
              ['Want to Read', `${stats.wantToRead} planned`],
              ['Completed', `${stats.completed} done`],
              ['Paused', `${stats.paused} paused`],
              ['Dropped', `${stats.dropped} dropped`],
              ['Favorites', `${stats.favorites} saved`],
            ].map(([label, caption]) => (
              <a key={label} href="#manga-library" className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition hover:-translate-y-0.5 hover:border-fuchsia-300/25 hover:bg-white/[0.06]">
                <div className="text-sm font-black text-white">{label}</div>
                <div className="mt-1 text-xs font-bold text-gray-500">{caption}</div>
              </a>
            ))}
          </div>
          {storageWarning && (
            <div className="rounded-2xl border border-amber-300/20 bg-amber-500/10 p-4 text-sm font-semibold text-amber-50">
              {storageWarning}
            </div>
          )}

          <MangaCoverCarousel userId={userId} onLibraryChange={setLibrary} onLoginRequired={onLoginClick} onStorageWarning={setStorageWarning} />
          <MangaSearchSection userId={userId} onLibraryChange={setLibrary} onLoginRequired={onLoginClick} onStorageWarning={setStorageWarning} />
          <MangaLibraryPanel userId={userId} items={library} onLibraryChange={setLibrary} onStorageWarning={setStorageWarning} />
        </div>
      </div>
    </main>
  );
};
