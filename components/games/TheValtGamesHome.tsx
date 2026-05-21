import React, { useMemo, useState } from 'react';
import type { GameApiSource } from '../../types/games.types';

interface TheValtGamesHomeProps {
  isLoggedIn: boolean;
  username?: string;
  onLoginClick: () => void;
}

const gameSources: GameApiSource[] = [
  {
    id: 'scryfall',
    name: 'Scryfall',
    subtitle: 'Magic: The Gathering',
    description: 'Card search, oracle text, sets, rulings, prices and high-quality card imagery for MTG workflows.',
    category: 'card_games',
    status: 'planned',
    accent: 'violet',
    endpoint: 'https://api.scryfall.com',
    highlights: ['MTG cards', 'oracle search', 'sets', 'prices'],
  },
  {
    id: 'pokeapi',
    name: 'PokeAPI',
    subtitle: 'Pokemon Data',
    description: 'Pokemon, abilities, moves, types, sprites and game metadata for collection and deck companion tools.',
    category: 'video_games',
    status: 'planned',
    accent: 'cyan',
    endpoint: 'https://pokeapi.co/api/v2',
    highlights: ['pokemon', 'moves', 'types', 'sprites'],
  },
  {
    id: 'apitcg',
    name: 'APITCG',
    subtitle: 'Trading Card Game APIs',
    description: 'Foundation slot for TCG APIs such as Pokemon TCG, Yu-Gi-Oh!, Flesh and Blood and future card sources.',
    category: 'tcg',
    status: 'planned',
    accent: 'rose',
    endpoint: 'Configurable',
    highlights: ['TCG search', 'card art', 'metadata', 'collections'],
  },
  {
    id: 'future-games',
    name: 'Game Vault',
    subtitle: 'Future Integrations',
    description: 'A modular expansion area for Steam-like metadata, RAWG, board games, deck builders and game collection APIs.',
    category: 'metadata',
    status: 'experimental',
    accent: 'emerald',
    endpoint: 'Future adapters',
    highlights: ['adapters', 'collections', 'metadata', 'favorites'],
  },
];

const accentClasses: Record<GameApiSource['accent'], string> = {
  violet: 'from-violet-500/20 to-fuchsia-500/10 border-violet-300/20 text-violet-100',
  cyan: 'from-cyan-500/20 to-blue-500/10 border-cyan-300/20 text-cyan-100',
  rose: 'from-rose-500/20 to-red-500/10 border-rose-300/20 text-rose-100',
  amber: 'from-amber-500/20 to-orange-500/10 border-amber-300/20 text-amber-100',
  emerald: 'from-emerald-500/20 to-teal-500/10 border-emerald-300/20 text-emerald-100',
};

const categoryLabels: Record<GameApiSource['category'] | 'all', string> = {
  all: 'All',
  card_games: 'Card Games',
  tcg: 'TCG',
  video_games: 'Games',
  metadata: 'Metadata',
};

export const TheValtGamesHome: React.FC<TheValtGamesHomeProps> = ({ isLoggedIn, username, onLoginClick }) => {
  const [activeCategory, setActiveCategory] = useState<GameApiSource['category'] | 'all'>('all');
  const [query, setQuery] = useState('');

  const filteredSources = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return gameSources.filter((source) => {
      const matchesCategory = activeCategory === 'all' || source.category === activeCategory;
      const matchesQuery = !normalizedQuery || [
        source.name,
        source.subtitle,
        source.description,
        source.endpoint,
        ...source.highlights,
      ].join(' ').toLowerCase().includes(normalizedQuery);
      return matchesCategory && matchesQuery;
    });
  }, [activeCategory, query]);

  return (
    <main className="min-h-screen overflow-hidden bg-[#05050a] text-white selection:bg-violet-500/30">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_14%_12%,rgba(124,58,237,0.22),transparent_30%),radial-gradient(circle_at_82%_18%,rgba(6,182,212,0.16),transparent_28%),radial-gradient(circle_at_54%_86%,rgba(236,72,153,0.12),transparent_30%),linear-gradient(180deg,#05050a_0%,#090912_48%,#05050a_100%)]" />

      <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
        <button type="button" className="group flex items-center gap-3 text-left">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-violet-300/20 bg-violet-500/10 shadow-[0_0_40px_rgba(139,92,246,0.2)]">
            <span className="text-sm font-black tracking-[0.18em] text-violet-100">TV</span>
          </span>
          <span>
            <span className="block text-xl font-black tracking-tight text-white">The Vault</span>
            <span className="block text-[10px] font-black uppercase tracking-[0.3em] text-cyan-300">Games</span>
          </span>
        </button>

        <div className="flex items-center gap-3">
          <span className="hidden rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-gray-400 sm:inline-flex">
            {isLoggedIn ? `Logged as ${username}` : 'Guest mode'}
          </span>
          {!isLoggedIn && (
            <button
              type="button"
              onClick={onLoginClick}
              className="rounded-full border border-violet-300/25 bg-violet-500/15 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-violet-100 transition hover:border-violet-200/40 hover:bg-violet-500/25"
            >
              Login
            </button>
          )}
        </div>
      </header>

      <section className="relative z-10 mx-auto grid min-h-[calc(100vh-88px)] w-full max-w-7xl items-center gap-10 px-5 pb-24 pt-6 sm:px-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-violet-300/20 bg-violet-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.26em] text-violet-100">
              The Vault Games
            </span>
            <span className="rounded-full border border-cyan-300/20 bg-cyan-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-100">
              TCG API Hub
            </span>
          </div>

          <h1 className="max-w-4xl text-5xl font-black leading-[0.95] tracking-tight text-white sm:text-6xl lg:text-7xl">
            Card games, game APIs and collection intelligence in one premium vault.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-gray-400 sm:text-lg">
            The new main area starts with Scryfall, PokeAPI and TCG-ready adapters, built to become a clean command center for cards, decks, sets, metadata and future game collections.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href="#game-sources"
              className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-cyan-500 px-6 py-4 text-sm font-black uppercase tracking-[0.18em] text-white shadow-2xl shadow-violet-950/40 transition hover:scale-[1.02]"
            >
              Explore APIs
            </a>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-4 text-sm font-black uppercase tracking-[0.18em] text-gray-200 transition hover:border-white/20 hover:bg-white/[0.08]"
            >
              Deck Lab Soon
            </button>
          </div>

          <div className="mt-10 grid max-w-2xl grid-cols-3 gap-3">
            {[
              ['3+', 'Initial APIs'],
              ['TCG', 'First-class focus'],
              ['Modular', 'Future sources'],
            ].map(([value, label]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 backdrop-blur-xl">
                <div className="text-2xl font-black text-white">{value}</div>
                <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500">{label}</div>
              </div>
            ))}
          </div>
        </div>

        <div id="game-sources" className="rounded-[2rem] border border-white/10 bg-black/30 p-4 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-5">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row">
            <label className="relative min-w-0 flex-1">
              <span className="absolute inset-y-0 left-4 flex items-center text-gray-500">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="h-12 w-full rounded-2xl border border-white/10 bg-black/35 pl-11 pr-4 text-sm font-semibold text-white outline-none transition placeholder:text-gray-600 focus:border-violet-300/60 focus:ring-4 focus:ring-violet-500/10"
                placeholder="Search game APIs..."
              />
            </label>
          </div>

          <div className="mb-5 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {(Object.keys(categoryLabels) as Array<GameApiSource['category'] | 'all'>).map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                className={`shrink-0 rounded-full border px-3 py-2 text-xs font-bold transition ${
                  activeCategory === category
                    ? 'border-cyan-300/40 bg-cyan-400/15 text-cyan-100'
                    : 'border-white/10 bg-white/[0.03] text-gray-500 hover:border-white/20 hover:text-white'
                }`}
              >
                {categoryLabels[category]}
              </button>
            ))}
          </div>

          <div className="grid gap-3">
            {filteredSources.map((source) => (
              <article
                key={source.id}
                className={`group overflow-hidden rounded-3xl border bg-gradient-to-br p-4 transition hover:-translate-y-0.5 hover:bg-white/[0.06] ${accentClasses[source.accent]}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-lg font-black text-white">{source.name}</div>
                    <div className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500">{source.subtitle}</div>
                  </div>
                  <span className="rounded-full border border-white/10 bg-black/35 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em]">
                    {source.status}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-gray-300">{source.description}</p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {source.highlights.map((highlight) => (
                    <span key={highlight} className="rounded-full border border-white/10 bg-black/25 px-2 py-1 text-[10px] font-bold text-gray-300">
                      {highlight}
                    </span>
                  ))}
                </div>
                <div className="mt-4 truncate rounded-2xl border border-white/10 bg-black/25 px-3 py-2 text-xs font-mono text-gray-400">
                  {source.endpoint}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
};
