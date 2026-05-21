import React, { useEffect, useState } from 'react';
import { ErrorState } from '../../../shared/components/ErrorState';
import { HorizontalCarousel } from '../../../shared/components/HorizontalCarousel';
import { LoadingState } from '../../../shared/components/LoadingState';
import { SectionHeader } from '../../../shared/components/SectionHeader';
import { addScryfallCardToDeck, saveUserDeck, type UserDeck } from '../../../shared/storage/userCollectionsService';
import { getFeaturedScryfallCards } from '../services/scryfallService';
import type { ScryfallSearchResult } from '../types/games.types';

interface TcgCardsCarouselProps {
  userId?: string;
  decks: UserDeck[];
  onDecksChange: (decks: UserDeck[]) => void;
  onLoginRequired: () => void;
}

export const TcgCardsCarousel: React.FC<TcgCardsCarouselProps> = ({
  userId,
  decks,
  onDecksChange,
  onLoginRequired,
}) => {
  const [cards, setCards] = useState<ScryfallSearchResult[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);
    getFeaturedScryfallCards()
      .then((nextCards) => {
        if (!isCancelled) setCards(nextCards);
      })
      .catch(() => {
        if (!isCancelled) setError('Scryfall cards could not be loaded right now.');
      })
      .finally(() => {
        if (!isCancelled) setIsLoading(false);
      });
    return () => {
      isCancelled = true;
    };
  }, []);

  const handleAddToDeck = (card: ScryfallSearchResult) => {
    if (!userId) {
      onLoginRequired();
      return;
    }
    onDecksChange(addScryfallCardToDeck(userId, card, decks[0]?.id));
  };

  const handleFavorite = (card: ScryfallSearchResult) => {
    if (!userId) {
      onLoginRequired();
      return;
    }
    setFavoriteIds((current) => (current.includes(card.id) ? current.filter((id) => id !== card.id) : [...current, card.id]));
    if (decks[0]) {
      onDecksChange(saveUserDeck(userId, { ...decks[0], isFavorite: true }));
    }
  };

  return (
    <section>
      <SectionHeader
        eyebrow="TCG Cards"
        title="Magic: The Gathering cards"
        description="Featured Scryfall cards for deck building, favorites and collection workflows."
        tone="cyan"
      />
      {isLoading && <LoadingState count={4} />}
      {error && <ErrorState message={error} />}
      {!isLoading && !error && (
        <HorizontalCarousel ariaLabel="Featured TCG cards carousel" tone="amber">
          {cards.map((card) => (
            <article key={card.id} className="w-56 shrink-0 snap-start overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] shadow-xl shadow-black/25">
              {card.imageUrl ? (
                <img src={card.imageUrl} alt={card.name} className="h-72 w-full object-cover object-top" loading="lazy" />
              ) : (
                <div className="flex h-72 items-center justify-center bg-cyan-500/10 text-sm font-bold text-cyan-100">{card.name}</div>
              )}
              <div className="p-4">
                <h3 className="text-base font-black text-white">{card.name}</h3>
                <p className="mt-1 text-xs font-bold text-gray-500">{card.typeLine}</p>
                <p className="mt-1 text-xs text-gray-500">{[card.setName, card.rarity].filter(Boolean).join(' · ')}</p>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button onClick={() => handleAddToDeck(card)} className="rounded-xl bg-cyan-500/15 px-3 py-2 text-xs font-black text-cyan-100 hover:bg-cyan-500/25">
                    Add to Deck
                  </button>
                  <button onClick={() => handleFavorite(card)} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-black text-gray-200 hover:bg-white/10">
                    {favoriteIds.includes(card.id) ? 'Favorited' : 'Favorite'}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </HorizontalCarousel>
      )}
    </section>
  );
};
