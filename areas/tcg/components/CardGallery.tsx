import React, { useEffect, useState } from 'react';
import { ErrorState } from '../../../shared/components/ErrorState';
import { LoadingState } from '../../../shared/components/LoadingState';
import { addScryfallCardToDeck, type UserDeck } from '../../../shared/storage/userCollectionsService';
import { searchScryfallCards } from '../services/scryfallService';
import type { ScryfallSearchResult } from '../../games/types/games.types';

interface CardGalleryProps {
  userId?: string;
  activeDeck?: UserDeck;
  onDecksChange: (decks: UserDeck[]) => void;
  onLoginRequired: () => void;
}

export const CardGallery: React.FC<CardGalleryProps> = ({ userId, activeDeck, onDecksChange, onLoginRequired }) => {
  const [query, setQuery] = useState('type:legendary');
  const [color, setColor] = useState('');
  const [rarity, setRarity] = useState('');
  const [cards, setCards] = useState<ScryfallSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const clauses = [query.trim(), color ? `c:${color}` : '', rarity ? `rarity:${rarity}` : ''].filter(Boolean).join(' ');
    if (clauses.length < 2) return;
    let isCancelled = false;
    setIsLoading(true);
    setError(null);
    const timeoutId = window.setTimeout(() => {
      searchScryfallCards(clauses)
        .then((results) => {
          if (!isCancelled) setCards(results);
        })
        .catch(() => {
          if (!isCancelled) setError('Scryfall gallery search failed.');
        })
        .finally(() => {
          if (!isCancelled) setIsLoading(false);
        });
    }, 420);
    return () => {
      isCancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [color, query, rarity]);

  const addToDeck = (card: ScryfallSearchResult) => {
    if (!userId) {
      onLoginRequired();
      return;
    }
    onDecksChange(addScryfallCardToDeck(userId, card, activeDeck?.id));
  };

  return (
    <section>
      <div className="mb-4">
        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-amber-200">Card Gallery</p>
        <h2 className="mt-2 text-2xl font-black text-white">Search and filter cards</h2>
      </div>
      <div className="mb-5 grid gap-3 md:grid-cols-[1fr_8rem_10rem]">
        <input value={query} onChange={(event) => setQuery(event.target.value)} className="h-12 rounded-2xl border border-white/10 bg-[#080812] px-4 text-sm font-semibold text-white outline-none" placeholder="Scryfall query, name, type..." />
        <select value={color} onChange={(event) => setColor(event.target.value)} className="h-12 rounded-2xl border border-white/10 bg-[#080812] px-3 text-xs font-bold text-white">
          <option value="">Any color</option>
          <option value="w">White</option>
          <option value="u">Blue</option>
          <option value="b">Black</option>
          <option value="r">Red</option>
          <option value="g">Green</option>
        </select>
        <select value={rarity} onChange={(event) => setRarity(event.target.value)} className="h-12 rounded-2xl border border-white/10 bg-[#080812] px-3 text-xs font-bold text-white">
          <option value="">Any rarity</option>
          <option value="common">Common</option>
          <option value="uncommon">Uncommon</option>
          <option value="rare">Rare</option>
          <option value="mythic">Mythic</option>
        </select>
      </div>
      {isLoading && <LoadingState count={4} />}
      {error && <ErrorState message={error} />}
      <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <article key={card.id} className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
            {card.imageUrl && <img src={card.imageUrl} alt={card.name} className="h-72 w-full object-cover object-top" />}
            <div className="space-y-2 p-4">
              <h3 className="text-base font-black text-white">{card.name}</h3>
              <p className="text-xs font-bold text-gray-500">{card.typeLine}</p>
              <p className="text-xs text-gray-500">{[card.setName, card.rarity].filter(Boolean).join(' · ')}</p>
              <button onClick={() => addToDeck(card)} className="w-full rounded-xl bg-amber-500/15 px-3 py-2 text-xs font-black text-amber-100 hover:bg-amber-500/25">
                Add to Deck
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};
