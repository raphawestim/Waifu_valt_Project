import React, { useState } from 'react';
import { EmptyState } from '../../../shared/components/EmptyState';
import { SectionHeader } from '../../../shared/components/SectionHeader';
import { createUserDeck, deleteUserDeck, saveUserDeck, type UserDeck } from '../../../shared/storage/userCollectionsService';

interface UserDecksPanelProps {
  userId?: string;
  decks: UserDeck[];
  onDecksChange: (decks: UserDeck[]) => void;
  onLoginRequired: () => void;
}

export const UserDecksPanel: React.FC<UserDecksPanelProps> = ({ userId, decks, onDecksChange, onLoginRequired }) => {
  const [name, setName] = useState('');

  const handleCreate = () => {
    if (!userId) {
      onLoginRequired();
      return;
    }
    const deck = createUserDeck(userId, name.trim() || 'New Deck');
    onDecksChange(saveUserDeck(userId, deck));
    setName('');
  };

  const totalCards = (deck: UserDeck) => deck.cards.reduce((sum, card) => sum + card.quantity, 0);

  return (
    <section id="my-decks">
      <SectionHeader eyebrow="My Collections" title="My Decks" description="Create decks, save cards and keep notes ready for future full deck editing." tone="cyan" />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Deck name..." className="h-11 flex-1 rounded-2xl border border-white/10 bg-[#080812] px-4 text-sm font-semibold text-white outline-none placeholder:text-gray-600" />
        <button onClick={handleCreate} className="rounded-2xl bg-cyan-500/15 px-5 py-3 text-sm font-black text-cyan-100 hover:bg-cyan-500/25">
          Create Deck
        </button>
      </div>
      {decks.length === 0 ? (
        <EmptyState message="No decks yet. Add a Scryfall card or create your first deck." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {decks.map((deck) => (
            <article key={deck.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-black text-white">{deck.name}</h3>
                  <p className="mt-1 text-xs font-bold capitalize text-gray-500">{deck.game.replace('_', ' ')}</p>
                </div>
                <button onClick={() => userId && onDecksChange(saveUserDeck(userId, { ...deck, isFavorite: !deck.isFavorite }))} className="text-xs font-black text-cyan-100">
                  {deck.isFavorite ? 'Favorited' : 'Favorite'}
                </button>
              </div>
              <p className="mt-4 text-sm text-gray-400">{totalCards(deck)} total cards · {deck.cards.length} unique</p>
              <div className="mt-4 flex -space-x-3">
                {deck.cards.slice(0, 5).map((card) => card.imageUrl && <img key={card.id} src={card.imageUrl} alt={card.name} className="h-16 w-12 rounded-lg border border-black object-cover" />)}
              </div>
              <button onClick={() => userId && onDecksChange(deleteUserDeck(userId, deck.id))} className="mt-4 text-xs font-bold text-rose-200 hover:text-rose-100">
                Delete
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};
