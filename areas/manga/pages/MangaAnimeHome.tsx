import React, { useEffect, useState } from 'react';
import { activeMangaApis, plannedMangaApis } from '../data/mangaApiRegistry';
import { MangaApiCard } from '../components/MangaApiCard';
import { BackToPortalButton } from '../../../shared/components/BackToPortalButton';
import { getUserMangaLibrary, type UserMangaItem } from '../../../shared/storage/userCollectionsService';
import { MangaCoverCarousel } from '../components/MangaCoverCarousel';
import { MangaLibraryPanel } from '../components/MangaLibraryPanel';
import { MangaSearchSection } from '../components/MangaSearchSection';

interface MangaAnimeHomeProps {
  isLoggedIn: boolean;
  username?: string;
  onBackToPortal: () => void;
  onEnterGames: () => void;
  onEnterNsfw: () => void;
  onLoginClick: () => void;
  userId?: string;
}

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

  useEffect(() => {
    setLibrary(userId ? getUserMangaLibrary(userId) : []);
  }, [userId]);

  return (
    <main className="min-h-screen overflow-hidden bg-[#05050a] text-white selection:bg-fuchsia-500/30">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(217,70,239,0.18),transparent_30%),radial-gradient(circle_at_82%_14%,rgba(124,58,237,0.18),transparent_28%),linear-gradient(180deg,#05050a_0%,#14081a_52%,#05050a_100%)]" />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-5 py-6 sm:px-8">
      <header className="flex flex-col gap-5 border-b border-white/10 pb-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <BackToPortalButton onClick={onBackToPortal} tone="fuchsia" />
          <h1 className="mt-4 text-5xl font-black leading-none tracking-tight text-white sm:text-6xl">The Vault Manga / Anime</h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-gray-400">
            Discover manga/anime, save favorite covers, maintain reading lists and keep safe metadata workflows separated from NSFW.
          </p>
          <p className="mt-2 text-sm font-black uppercase tracking-[0.22em] text-fuchsia-200/80">
            Manga · Anime · Metadata · Reading · Favorites
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-bold text-gray-400">
            {isLoggedIn ? `Logged as ${username}` : 'Guest mode'}
          </span>
          {!isLoggedIn && (
            <button type="button" onClick={onLoginClick} className="rounded-full border border-fuchsia-300/25 bg-fuchsia-500/10 px-4 py-2 text-xs font-black text-fuchsia-100 hover:bg-fuchsia-500/20">
              Login
            </button>
          )}
          <button type="button" onClick={onEnterGames} className="rounded-full border border-cyan-300/20 bg-cyan-500/10 px-4 py-2 text-xs font-black text-cyan-100 hover:bg-cyan-500/20">
            Games
          </button>
          <button type="button" onClick={onEnterNsfw} className="rounded-full border border-rose-300/20 bg-rose-500/10 px-4 py-2 text-xs font-black text-rose-100 hover:bg-rose-500/20">
            NSFW 18+
          </button>
        </div>
      </header>

      <div className="space-y-10 py-8">
        <div className="grid gap-3 md:grid-cols-4">
          {[
            ['My Favorites', '#manga-library', `${library.filter((item) => item.isFavorite).length} saved`],
            ['Reading List', '#manga-library', `${library.filter((item) => item.status === 'reading').length} reading`],
            ['Search Manga', '#search-manga', 'AniList / Jikan'],
            ['Completed', '#manga-library', `${library.filter((item) => item.status === 'completed').length} done`],
          ].map(([label, href, caption]) => (
            <a key={label} href={href} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition hover:-translate-y-0.5 hover:border-fuchsia-300/25 hover:bg-white/[0.06]">
              <div className="text-sm font-black text-white">{label}</div>
              <div className="mt-1 text-xs font-bold text-gray-500">{caption}</div>
            </a>
          ))}
        </div>

        <MangaCoverCarousel userId={userId} onLibraryChange={setLibrary} onLoginRequired={onLoginClick} />
        <MangaSearchSection userId={userId} onLibraryChange={setLibrary} onLoginRequired={onLoginClick} />
        <MangaLibraryPanel userId={userId} items={library} onLibraryChange={setLibrary} />

        <section>
          <div className="mb-4">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-emerald-200">Active APIs</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-white">Ready for MVP discovery</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {activeMangaApis.map((api) => (
              <MangaApiCard key={api.id} api={api} />
            ))}
          </div>
        </section>

        <section>
          <div className="mb-4">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-fuchsia-200">Planned Integrations</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-white">Metadata-first expansion</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {plannedMangaApis.map((api) => (
              <MangaApiCard key={api.id} api={api} />
            ))}
          </div>
        </section>
      </div>
    </div>
  </main>
  );
};
