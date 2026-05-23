import React, { useEffect, useMemo, useState } from 'react';
import { EmptyState } from '../../../shared/components/EmptyState';
import { ErrorState } from '../../../shared/components/ErrorState';
import { LoadingState } from '../../../shared/components/LoadingState';
import { SectionHeader } from '../../../shared/components/SectionHeader';
import { searchCards } from '../services/scryfallService';
import {
  addCardGlobalFavorite,
  addCardToDeckHybrid,
  isCardGlobalFavorite,
  loadUserDecks,
  removeCardGlobalFavorite,
} from '../services/userDecksService';
import type { CardSearchFilters, ScryfallCard, UserDeck } from '../types/tcg.types';

interface CardGalleryProps {
  userId?: string;
  activeDeck?: UserDeck;
  onDecksChange: (decks: UserDeck[]) => void;
  onStorageWarning?: (message: string) => void;
  onLoginRequired: () => void;
}

export const CardGallery: React.FC<CardGalleryProps> = ({ userId, activeDeck, onDecksChange, onStorageWarning, onLoginRequired }) => {
  const [query, setQuery] = useState('sol ring');
  const [color, setColor] = useState('');
  const [type, setType] = useState('');
  const [rarity, setRarity] = useState('');
  const [manaValue, setManaValue] = useState('');
  const [format, setFormat] = useState('');
  const [cards, setCards] = useState<ScryfallCard[]>([]);
  const [selectedCard, setSelectedCard] = useState<ScryfallCard | null>(null);
  const [page, setPage] = useState(1);
  const [favoriteVersion, setFavoriteVersion] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filters: CardSearchFilters = useMemo(() => ({
    color,
    type,
    rarity,
    manaValue,
    format,
    page,
  }), [color, format, manaValue, page, rarity, type]);

  const resetPage = () => setPage(1);

  useEffect(() => {
    if (query.trim().length < 2 && !color && !type && !rarity && !manaValue && !format) return;
    let isCancelled = false;
    setIsLoading(true);
    setError(null);
    const timeoutId = window.setTimeout(() => {
      searchCards(query, filters)
        .then((results) => {
          if (!isCancelled) setCards((current) => (page > 1 ? [...current, ...results] : results));
        })
        .catch(() => {
          if (!isCancelled) {
            if (page === 1) setCards([]);
            setError('Scryfall gallery search failed. Try a broader query or adjust filters.');
          }
        })
        .finally(() => {
          if (!isCancelled) setIsLoading(false);
        });
    }, 500);
    return () => {
      isCancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [color, filters, format, manaValue, page, query, rarity, type]);

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
    if (isCardGlobalFavorite(userId, card.id)) removeCardGlobalFavorite(userId, card.id);
    else addCardGlobalFavorite(userId, card);
    setFavoriteVersion((version) => version + 1);
  };

  return (
    <section className="rounded-3xl border border-white/10 bg-black/20 p-4 shadow-2xl shadow-black/25 sm:p-5">
      <SectionHeader
        eyebrow="Card Gallery"
        title="Search and filter Magic cards"
        description="Use simple Scryfall filters, add cards to your active deck and save favorites to the global profile."
        tone="amber"
      />
      <div className="mb-5 grid gap-3 md:grid-cols-[minmax(0,1fr)_8rem_9rem_9rem_8rem_9rem]">
        <input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            resetPage();
          }}
          className="h-12 rounded-2xl border border-white/10 bg-[#080812] px-4 text-sm font-semibold text-white outline-none transition focus:border-amber-300/40"
          placeholder="Search cards, e.g. sol ring, dragon, counterspell..."
        />
        <select
          value={color}
          onChange={(event) => {
            setColor(event.target.value);
            resetPage();
          }}
          className="h-12 rounded-2xl border border-white/10 bg-[#080812] px-3 text-xs font-bold text-white"
        >
          <option value="">Any color</option>
          <option value="w">White</option>
          <option value="u">Blue</option>
          <option value="b">Black</option>
          <option value="r">Red</option>
          <option value="g">Green</option>
        </select>
        <select
          value={type}
          onChange={(event) => {
            setType(event.target.value);
            resetPage();
          }}
          className="h-12 rounded-2xl border border-white/10 bg-[#080812] px-3 text-xs font-bold text-white"
        >
          <option value="">Any type</option>
          <option value="creature">Creature</option>
          <option value="instant">Instant</option>
          <option value="sorcery">Sorcery</option>
          <option value="artifact">Artifact</option>
          <option value="enchantment">Enchantment</option>
          <option value="planeswalker">Planeswalker</option>
          <option value="land">Land</option>
        </select>
        <select
          value={rarity}
          onChange={(event) => {
            setRarity(event.target.value);
            resetPage();
          }}
          className="h-12 rounded-2xl border border-white/10 bg-[#080812] px-3 text-xs font-bold text-white"
        >
          <option value="">Any rarity</option>
          <option value="common">Common</option>
          <option value="uncommon">Uncommon</option>
          <option value="rare">Rare</option>
          <option value="mythic">Mythic</option>
        </select>
        <input
          value={manaValue}
          onChange={(event) => {
            setManaValue(event.target.value.replace(/[^\d]/g, ''));
            resetPage();
          }}
          className="h-12 rounded-2xl border border-white/10 bg-[#080812] px-3 text-xs font-bold text-white outline-none"
          placeholder="Mana"
        />
        <select
          value={format}
          onChange={(event) => {
            setFormat(event.target.value);
            resetPage();
          }}
          className="h-12 rounded-2xl border border-white/10 bg-[#080812] px-3 text-xs font-bold text-white"
        >
          <option value="">Any format</option>
          <option value="standard">Standard</option>
          <option value="commander">Commander</option>
          <option value="modern">Modern</option>
          <option value="pioneer">Pioneer</option>
        </select>
      </div>
      {isLoading && page === 1 && <LoadingState count={8} />}
      {error && <ErrorState message={error} />}
      {!isLoading && !error && cards.length === 0 && <EmptyState message="No cards found. Try a broader query or fewer filters." />}
      <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {cards.map((card) => (
          <article key={`${card.id}-${favoriteVersion}`} className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] shadow-xl shadow-black/20 transition hover:-translate-y-1 hover:border-amber-300/25 hover:bg-white/[0.065]">
            {card.image_uris?.normal ? (
              <img src={card.image_uris.normal} alt={card.name} className="h-72 w-full object-cover object-top" />
            ) : (
              <div className="flex h-72 items-center justify-center bg-white/[0.03] px-6 text-center text-xs font-bold text-gray-500">No image available</div>
            )}
            <div className="space-y-2 p-4">
              <div>
                <h3 className="line-clamp-2 min-h-[2.5rem] text-base font-black text-white">{card.name}</h3>
                <p className="mt-1 line-clamp-2 text-xs font-bold text-gray-500">{card.type_line}</p>
                <p className="mt-1 line-clamp-1 text-xs text-gray-500">{[card.set_name, card.rarity].filter(Boolean).join(' · ')}</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => addToDeck(card)}
                  disabled={!activeDeck}
                  className="rounded-xl bg-cyan-500/15 px-2 py-2 text-xs font-black text-cyan-100 hover:bg-cyan-500/25 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => toggleFavorite(card)}
                  className="rounded-xl border border-white/10 bg-white/5 px-2 py-2 text-xs font-black text-gray-200 hover:bg-white/10"
                >
                  {userId && isCardGlobalFavorite(userId, card.id) ? 'Saved' : 'Fav'}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCard(card)}
                  className="rounded-xl border border-white/10 bg-white/5 px-2 py-2 text-xs font-black text-gray-200 hover:bg-white/10"
                >
                  Details
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
      {cards.length > 0 && (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={() => setPage((current) => current + 1)}
            disabled={isLoading}
            className="rounded-2xl border border-amber-300/25 bg-amber-500/10 px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-amber-100 transition hover:bg-amber-500/20 disabled:opacity-50"
          >
            {isLoading ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
      {selectedCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 py-8 backdrop-blur-md" role="dialog" aria-modal="true">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-white/10 bg-[#090912] p-5 shadow-2xl shadow-black">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-amber-200">{selectedCard.set_name || selectedCard.set}</p>
                <h3 className="mt-2 text-3xl font-black text-white">{selectedCard.name}</h3>
                <p className="mt-2 text-sm font-bold text-gray-500">{selectedCard.type_line}</p>
              </div>
              <button type="button" onClick={() => setSelectedCard(null)} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-black text-white">Close</button>
            </div>
            <div className="mt-5 grid gap-5 md:grid-cols-[16rem_minmax(0,1fr)]">
              {selectedCard.image_uris?.normal && <img src={selectedCard.image_uris.normal} alt={selectedCard.name} className="w-full rounded-2xl border border-white/10" />}
              <div className="space-y-4 text-sm leading-7 text-gray-300">
                <p>{selectedCard.oracle_text || 'No oracle text available.'}</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">Mana</p>
                    <p className="mt-1 font-black text-white">{selectedCard.mana_cost || '-'} · MV {selectedCard.cmc ?? '-'}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">Market</p>
                    <p className="mt-1 font-black text-white">{selectedCard.prices?.usd ? `$${selectedCard.prices.usd}` : 'No price'}</p>
                  </div>
                </div>
                {selectedCard.scryfall_uri && (
                  <a href={selectedCard.scryfall_uri} target="_blank" rel="noreferrer" className="inline-flex rounded-2xl border border-amber-300/25 bg-amber-500/10 px-5 py-3 text-xs font-black text-amber-100">
                    Open on Scryfall
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
