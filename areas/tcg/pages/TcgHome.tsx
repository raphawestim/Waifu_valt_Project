import React, { useEffect, useMemo, useState } from 'react';
import { BackToPortalButton } from '../../../shared/components/BackToPortalButton';
import { SectionHeader } from '../../../shared/components/SectionHeader';
import { CardGallery } from '../components/CardGallery';
import { DeckBuilderSidebar } from '../components/DeckBuilderSidebar';
import { NewCardsCarousel } from '../components/NewCardsCarousel';
import { createUserDeckHybrid, getDeckStats, loadUserDecks } from '../services/userDecksService';
import type { UserDeck } from '../types/tcg.types';

interface TcgHomeProps {
  isLoggedIn: boolean;
  username?: string;
  userId?: string;
  onBackToPortal: () => void;
  onEnterNsfw: () => void;
  onLoginClick: () => void;
}

export const TcgHome: React.FC<TcgHomeProps> = ({
  isLoggedIn,
  username,
  userId,
  onBackToPortal,
  onEnterNsfw,
  onLoginClick,
}) => {
  const [decks, setDecks] = useState<UserDeck[]>([]);
  const [activeDeckId, setActiveDeckId] = useState('');
  const [storageMode, setStorageMode] = useState<'backend' | 'local'>('local');
  const [storageWarning, setStorageWarning] = useState('');

  useEffect(() => {
    let isCancelled = false;
    if (!userId) {
      setDecks([]);
      setActiveDeckId('');
      setStorageMode('local');
      setStorageWarning('');
      return;
    }

    loadUserDecks(userId).then((result) => {
      if (isCancelled) return;
      setDecks(result.decks);
      setStorageMode(result.storage);
      setStorageWarning(result.warning || '');
      setActiveDeckId((current) => current || result.decks[0]?.id || '');
    });

    return () => {
      isCancelled = true;
    };
  }, [userId]);

  const activeDeck = useMemo(() => decks.find((deck) => deck.id === activeDeckId) || decks[0], [activeDeckId, decks]);
  const stats = useMemo(() => (userId ? getDeckStats(userId) : { totalDecks: 0, favoriteDecks: 0, totalCards: 0 }), [userId, decks]);

  const createDeck = async () => {
    if (!userId) {
      onLoginClick();
      return;
    }
    const result = await createUserDeckHybrid(userId, {
      name: decks.length ? `Vault Deck ${decks.length + 1}` : 'Starter Magic Deck',
      description: 'Built in The Vault TCG',
      game: 'magic',
      format: 'standard',
    });
    const nextDecks = await loadUserDecks(userId);
    setDecks(nextDecks.decks);
    setStorageMode(nextDecks.storage);
    setStorageWarning(result.warning || nextDecks.warning || '');
    setActiveDeckId(result.deck.id);
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#05050a] text-white selection:bg-amber-500/30">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_16%_0%,rgba(245,158,11,0.16),transparent_30%),radial-gradient(circle_at_78%_12%,rgba(124,58,237,0.18),transparent_28%),linear-gradient(180deg,#05050a_0%,#120d06_52%,#05050a_100%)]" />
      <div className="relative z-10 mx-auto w-full max-w-[92rem] px-5 py-6 sm:px-8">
        <header className="flex flex-col gap-5 border-b border-white/10 pb-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <BackToPortalButton onClick={onBackToPortal} tone="violet" />
            <h1 className="mt-4 text-5xl font-black leading-none tracking-tight text-white sm:text-6xl">The Vault TCG</h1>
            <p className="mt-3 text-sm font-black uppercase tracking-[0.22em] text-amber-200/80">Cards · Decks · Collections · TCG Tools</p>
            <p className="mt-4 max-w-3xl text-base leading-8 text-gray-400">
              Explore cards, build decks, manage collections and organize TCG strategies across different games.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-bold text-gray-400">
              {isLoggedIn ? `Logged as ${username}` : 'Guest mode'}
            </span>
            {isLoggedIn && (
              <span className={`rounded-full border px-3 py-2 text-xs font-black uppercase tracking-[0.12em] ${
                storageMode === 'backend'
                  ? 'border-amber-300/20 bg-amber-500/10 text-amber-100'
                  : 'border-amber-300/20 bg-amber-500/10 text-amber-100'
              }`}>
                Decks: {storageMode === 'backend' ? 'Backend' : 'Local'}
              </span>
            )}
            {!isLoggedIn && <button onClick={onLoginClick} className="rounded-full border border-amber-300/25 bg-amber-500/10 px-4 py-2 text-xs font-black text-amber-100">Login</button>}
            <a href="/tcg/decks" className="rounded-full border border-amber-300/25 bg-amber-500/10 px-4 py-2 text-xs font-black text-amber-100">My Decks</a>
            <button onClick={createDeck} className="rounded-full border border-violet-300/25 bg-violet-500/10 px-4 py-2 text-xs font-black text-violet-100">New Deck</button>
            <button onClick={onEnterNsfw} className="rounded-full border border-rose-300/20 bg-rose-500/10 px-4 py-2 text-xs font-black text-rose-100">NSFW 18+</button>
          </div>
        </header>

        <div className="grid min-w-0 gap-6 py-8 lg:grid-cols-[20rem_minmax(0,1fr)]">
          <DeckBuilderSidebar
            userId={userId}
            deck={activeDeck}
            decks={decks}
            onDecksChange={setDecks}
            onCreateDeck={createDeck}
            onDeckSelect={setActiveDeckId}
            onLoginRequired={onLoginClick}
            onStorageWarning={setStorageWarning}
          />
          <div className="min-w-0 space-y-10 overflow-hidden">
            {storageWarning && (
              <section className="rounded-3xl border border-amber-300/20 bg-amber-500/10 p-5 text-sm font-semibold leading-7 text-amber-50 shadow-2xl shadow-black/20">
                {storageWarning}
              </section>
            )}
            <section className="rounded-3xl border border-amber-300/15 bg-black/25 p-5 shadow-2xl shadow-black/30 backdrop-blur-xl">
              <SectionHeader
                eyebrow="Vault TCG"
                title="Build decks with Scryfall search"
                description="Search Magic cards, save favorites, validate formats and keep local decks ready for a future backend."
                tone="amber"
                action={
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2">
                      <div className="text-lg font-black text-white">{stats.totalDecks}</div>
                      <div className="text-[9px] font-black uppercase tracking-[0.14em] text-gray-500">Decks</div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2">
                      <div className="text-lg font-black text-white">{stats.totalCards}</div>
                      <div className="text-[9px] font-black uppercase tracking-[0.14em] text-gray-500">Cards</div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2">
                      <div className="text-lg font-black text-white">{stats.favoriteDecks}</div>
                      <div className="text-[9px] font-black uppercase tracking-[0.14em] text-gray-500">Favs</div>
                    </div>
                  </div>
                }
              />
            </section>
            <NewCardsCarousel userId={userId} activeDeck={activeDeck} onDecksChange={setDecks} onStorageWarning={setStorageWarning} onLoginRequired={onLoginClick} />
            <CardGallery userId={userId} activeDeck={activeDeck} onDecksChange={setDecks} onStorageWarning={setStorageWarning} onLoginRequired={onLoginClick} />
          </div>
        </div>
      </div>
    </main>
  );
};
