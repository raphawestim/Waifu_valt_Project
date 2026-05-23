import React, { useEffect, useState } from 'react';
import { EmptyState } from '../../../shared/components/EmptyState';
import { ErrorState } from '../../../shared/components/ErrorState';
import { HorizontalCarousel } from '../../../shared/components/HorizontalCarousel';
import { LoadingState } from '../../../shared/components/LoadingState';
import { SectionHeader } from '../../../shared/components/SectionHeader';
import { getLatestCards } from '../services/scryfallService';
import {
  addCardGlobalFavorite,
  addCardToDeckHybrid,
  isCardGlobalFavorite,
  loadUserDecks,
  removeCardGlobalFavorite,
} from '../services/userDecksService';
import type { ScryfallCard, UserDeck } from '../types/tcg.types';

interface NewCardsCarouselProps {
  userId?: string;
  activeDeck?: UserDeck;
  onDecksChange: (decks: UserDeck[]) => void;
  onStorageWarning?: (message: string) => void;
  onLoginRequired: () => void;
}

const cardImage = (card: ScryfallCard) => card.image_uris?.normal || card.image_uris?.large || card.image_uris?.small;

export const NewCardsCarousel: React.FC<NewCardsCarouselProps> = ({
  userId,
  activeDeck,
  onDecksChange,
  onStorageWarning,
  onLoginRequired,
}) => {
  const [cards, setCards] = useState<ScryfallCard[]>([]);
  const [favoriteVersion, setFavoriteVersion] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);
    setError(null);
    getLatestCards()
      .then((results) => {
        if (!isCancelled) setCards(results);
      })
      .catch(() => {
        if (!isCancelled) setError('Scryfall is unavailable right now. Try again in a moment.');
      })
      .finally(() => {
        if (!isCancelled) setIsLoading(false);
      });
    return () => {
      isCancelled = true;
    };
  }, []);

  const addToDeck = async (card: ScryfallCard) => {
    if (!userId) {
      onLoginRequired();
      return;
    }
    if (!activeDeck) return;
    const result = await addCardToDeckHybrid(userId, activeDeck.id, card);
    const decks = await loadUserDecks(userId);
    onStorageWarning?.(result.warning || decks.warning || '');
    onDecksChange(decks.decks);
  };

  const toggleFavorite = (card: ScryfallCard) => {
    if (!userId) {
      onLoginRequired();
      return;
    }
    if (isCardGlobalFavorite(userId, card.id)) {
      removeCardGlobalFavorite(userId, card.id);
    } else {
      addCardGlobalFavorite(userId, card);
    }
    setFavoriteVersion((version) => version + 1);
  };

  return (
    <section>
      <SectionHeader
        eyebrow="Latest Collection"
        title="New cards from Scryfall"
        description="Recent paper cards ready for deck building, favorites and collection workflows."
        tone="amber"
      />
      {isLoading && <LoadingState count={4} />}
      {error && <ErrorState message={error} />}
      {!isLoading && !error && cards.length === 0 && <EmptyState message="No cards returned from Scryfall." />}
      {!isLoading && !error && cards.length > 0 && (
        <HorizontalCarousel ariaLabel="Latest Scryfall cards" tone="amber">
          {cards.map((card) => {
            const imageUrl = cardImage(card);
            const isFavorite = userId ? isCardGlobalFavorite(userId, card.id) : false;
            return (
              <article
                key={`${card.id}-${favoriteVersion}`}
                className="w-[13.5rem] shrink-0 snap-start overflow-hidden rounded-2xl border border-amber-300/15 bg-white/[0.045] shadow-2xl shadow-black/25"
              >
                <div className="h-72 bg-black/35">
                  {imageUrl ? (
                    <img src={imageUrl} alt={card.name} className="h-full w-full object-cover object-top" />
                  ) : (
                    <div className="flex h-full items-center justify-center px-4 text-center text-xs font-bold text-gray-500">No image</div>
                  )}
                </div>
                <div className="space-y-3 p-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-amber-200">{card.rarity || 'card'}</p>
                    <h3 className="mt-1 line-clamp-2 min-h-[2.5rem] text-base font-black text-white">{card.name}</h3>
                    <p className="mt-1 line-clamp-2 text-xs font-semibold text-gray-500">{card.type_line}</p>
                  </div>
                  <p className="line-clamp-1 text-xs text-gray-500">{card.set_name || card.set}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => addToDeck(card)}
                      disabled={!activeDeck}
                      className="rounded-xl bg-cyan-500/15 px-3 py-2 text-xs font-black text-cyan-100 transition hover:bg-cyan-500/25 disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleFavorite(card)}
                      className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-black text-gray-200 transition hover:bg-white/10"
                    >
                      {isFavorite ? 'Saved' : 'Favorite'}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </HorizontalCarousel>
      )}
    </section>
  );
};
