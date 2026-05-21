import React, { useEffect, useMemo, useState } from 'react';
import { BackToPortalButton } from '../../../shared/components/BackToPortalButton';
import { SectionHeader } from '../../../shared/components/SectionHeader';
import { createUserDeck, getUserDecks, saveUserDeck, type UserDeck } from '../../../shared/storage/userCollectionsService';
import { TcgCardsCarousel } from '../../games/components/TcgCardsCarousel';
import { CardGallery } from '../components/CardGallery';
import { DeckBuilderSidebar } from '../components/DeckBuilderSidebar';

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

  useEffect(() => {
    if (!userId) {
      setDecks([]);
      setActiveDeckId('');
      return;
    }
    const existingDecks = getUserDecks(userId);
    const nextDecks = existingDecks.length > 0
      ? existingDecks
      : saveUserDeck(userId, { ...createUserDeck(userId, 'Starter Magic Deck', 'magic'), description: 'Default deck for Vault TCG' });
    setDecks(nextDecks);
    setActiveDeckId(nextDecks[0]?.id || '');
  }, [userId]);

  const activeDeck = useMemo(() => decks.find((deck) => deck.id === activeDeckId) || decks[0], [activeDeckId, decks]);

  const createDeck = () => {
    if (!userId) {
      onLoginClick();
      return;
    }
    const deck = createUserDeck(userId, 'New TCG Deck', 'magic');
    const nextDecks = saveUserDeck(userId, { ...deck, description: 'Built in Vault TCG' });
    setDecks(nextDecks);
    setActiveDeckId(deck.id);
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#05050a] text-white selection:bg-amber-500/30">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_16%_0%,rgba(245,158,11,0.16),transparent_30%),radial-gradient(circle_at_78%_12%,rgba(124,58,237,0.18),transparent_28%),linear-gradient(180deg,#05050a_0%,#120d06_52%,#05050a_100%)]" />
      <div className="relative z-10 mx-auto w-full max-w-[92rem] px-5 py-6 sm:px-8">
        <header className="flex flex-col gap-5 border-b border-white/10 pb-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <BackToPortalButton onClick={onBackToPortal} tone="violet" />
            <h1 className="mt-4 text-5xl font-black leading-none tracking-tight text-white sm:text-6xl">The Vault TCG</h1>
            <p className="mt-3 text-sm font-black uppercase tracking-[0.22em] text-amber-200/80">Cards · Decks · Collections</p>
            <p className="mt-4 max-w-3xl text-base leading-8 text-gray-400">
              Explore cards, build decks, validate formats and organize TCG strategies across different games.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-bold text-gray-400">
              {isLoggedIn ? `Logged as ${username}` : 'Guest mode'}
            </span>
            {!isLoggedIn && <button onClick={onLoginClick} className="rounded-full border border-amber-300/25 bg-amber-500/10 px-4 py-2 text-xs font-black text-amber-100">Login</button>}
            <button onClick={createDeck} className="rounded-full border border-amber-300/25 bg-amber-500/10 px-4 py-2 text-xs font-black text-amber-100">My Decks</button>
            <button onClick={onEnterNsfw} className="rounded-full border border-rose-300/20 bg-rose-500/10 px-4 py-2 text-xs font-black text-rose-100">NSFW 18+</button>
          </div>
        </header>

        <div className="grid min-w-0 gap-6 py-8 lg:grid-cols-[20rem_minmax(0,1fr)]">
          <DeckBuilderSidebar userId={userId} deck={activeDeck} decks={decks} onDecksChange={setDecks} />
          <div className="min-w-0 space-y-10 overflow-hidden">
            <section className="rounded-3xl border border-amber-300/15 bg-black/25 p-5 shadow-2xl shadow-black/30 backdrop-blur-xl">
              <SectionHeader
                eyebrow="Vault TCG"
                title="Build decks with live card search"
                description="Desktop keeps the deck builder pinned on the left; mobile stacks it above the card gallery."
                tone="cyan"
                action={
                  <select value={activeDeck?.id || ''} onChange={(event) => setActiveDeckId(event.target.value)} className="h-10 rounded-xl border border-white/10 bg-[#080812] px-3 text-xs font-bold text-white">
                    {decks.length === 0 && <option value="">No decks</option>}
                    {decks.map((deck) => <option key={deck.id} value={deck.id}>{deck.name}</option>)}
                  </select>
                }
              />
            </section>
            <TcgCardsCarousel userId={userId} decks={decks} onDecksChange={setDecks} onLoginRequired={onLoginClick} />
            <CardGallery userId={userId} activeDeck={activeDeck} onDecksChange={setDecks} onLoginRequired={onLoginClick} />
          </div>
        </div>
      </div>
    </main>
  );
};
