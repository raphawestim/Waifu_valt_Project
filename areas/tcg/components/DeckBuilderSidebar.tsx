import React from 'react';
import { deckRulesRegistry, getDeckRulePreset, validateDeck } from '../data/deckRulesRegistry';
import {
  deleteUserDeckHybrid,
  loadUserDecks,
  removeCardFromDeckHybrid,
  saveUserDeckHybrid,
  toggleDeckFavoriteHybrid,
  updateDeckCardQuantityHybrid,
  updateDeckFormatHybrid,
  updateUserDeckHybrid,
} from '../services/userDecksService';
import type { DeckFormat, TcgGame, UserDeck } from '../types/tcg.types';

interface DeckBuilderSidebarProps {
  userId?: string;
  deck?: UserDeck;
  decks: UserDeck[];
  onDecksChange: (decks: UserDeck[]) => void;
  onCreateDeck: () => void;
  onDeckSelect: (deckId: string) => void;
  onLoginRequired: () => void;
  onStorageWarning?: (message: string) => void;
}

const defaultFormatForGame = (game: TcgGame): DeckFormat => {
  if (game === 'pokemon_tcg') return 'pokemon_standard';
  if (game === 'yugioh') return 'yugioh_advanced';
  if (game === 'custom') return 'custom';
  return 'standard';
};

export const DeckBuilderSidebar: React.FC<DeckBuilderSidebarProps> = ({
  userId,
  deck,
  decks,
  onDecksChange,
  onCreateDeck,
  onDeckSelect,
  onLoginRequired,
  onStorageWarning,
}) => {
  const preset = deck ? getDeckRulePreset(deck.game, deck.format) : deckRulesRegistry[0];
  const validation = deck ? validateDeck(deck, preset) : null;

  const syncDecks = async () => {
    if (!userId) return;
    const result = await loadUserDecks(userId);
    onDecksChange(result.decks);
    onStorageWarning?.(result.warning || '');
  };

  const updateQuantity = async (cardId: string, delta: number, currentQuantity: number) => {
    if (!userId || !deck) return;
    const result = await updateDeckCardQuantityHybrid(userId, deck.id, cardId, currentQuantity + delta);
    onStorageWarning?.(result.warning || '');
    await syncDecks();
  };

  const removeCard = async (cardId: string) => {
    if (!userId || !deck) return;
    const result = await removeCardFromDeckHybrid(userId, deck.id, cardId);
    onStorageWarning?.(result.warning || '');
    await syncDecks();
  };

  const updateMeta = async (patch: Partial<UserDeck>) => {
    if (!userId || !deck) return;
    const result = await updateUserDeckHybrid(userId, deck.id, patch);
    onStorageWarning?.(result.warning || '');
    await syncDecks();
  };

  const changeFormat = async (game: TcgGame, format: DeckFormat) => {
    if (!userId || !deck) return;
    const result = await updateDeckFormatHybrid(userId, deck.id, game, format);
    onStorageWarning?.(result.warning || '');
    await syncDecks();
  };

  const favoriteDeck = async () => {
    if (!userId || !deck) return;
    const result = await toggleDeckFavoriteHybrid(userId, deck.id);
    onStorageWarning?.(result.warning || '');
    await syncDecks();
  };

  const clearDeck = async () => {
    if (!userId || !deck) return;
    let warning = '';
    for (const card of deck.cards) {
      const result = await removeCardFromDeckHybrid(userId, deck.id, card.id);
      warning = warning || result.warning || '';
    }
    if (deck.cards.length === 0) {
      const result = await saveUserDeckHybrid(userId, { ...deck, cards: [] });
      warning = result.warning || warning;
    }
    onStorageWarning?.(warning);
    await syncDecks();
  };

  const deleteDeck = async () => {
    if (!userId || !deck) return;
    const result = await deleteUserDeckHybrid(userId, deck.id);
    const nextDecks = await loadUserDecks(userId);
    onStorageWarning?.(result.warning || nextDecks.warning || '');
    onDecksChange(nextDecks.decks);
    onDeckSelect(nextDecks.decks[0]?.id || '');
  };

  return (
    <aside className="min-w-0 rounded-3xl border border-amber-300/15 bg-black/35 p-4 shadow-2xl shadow-black/30 backdrop-blur-xl lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto">
      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-amber-200">Deck Builder</p>
      {!userId && (
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.035] p-4">
          <h2 className="text-xl font-black text-white">Login to build decks</h2>
          <p className="mt-2 text-sm leading-6 text-gray-400">Browse Scryfall freely. Saving decks and favorites requires a The Vault profile.</p>
          <button type="button" onClick={onLoginRequired} className="mt-4 w-full rounded-2xl bg-amber-500/15 px-4 py-3 text-xs font-black text-amber-100 hover:bg-amber-500/25">Login</button>
        </div>
      )}

      {userId && (
        <div className="mt-4 space-y-3">
          <button type="button" onClick={onCreateDeck} className="w-full rounded-2xl bg-gradient-to-r from-violet-600 to-amber-500 px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-white">New Deck</button>
          <select value={deck?.id || ''} onChange={(event) => onDeckSelect(event.target.value)} className="h-11 w-full rounded-2xl border border-white/10 bg-[#080812] px-3 text-xs font-bold text-white">
            {decks.length === 0 && <option value="">No decks</option>}
            {decks.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </div>
      )}

      <h2 className="mt-4 text-2xl font-black text-white">{deck?.name || 'No active deck'}</h2>
      {deck && (
        <input value={deck.name} onChange={(event) => updateMeta({ name: event.target.value })} className="mt-3 h-11 w-full rounded-2xl border border-white/10 bg-white/[0.035] px-3 text-sm font-bold text-white outline-none focus:border-amber-300/40" aria-label="Deck name" />
      )}
      <p className="mt-2 text-xs font-bold text-gray-500">{preset.game.replace('_', ' ')} · {preset.format}</p>

      {deck && (
        <div className="mt-4 grid grid-cols-2 gap-2">
          <select
            value={deck.game}
            onChange={(event) => {
              const game = event.target.value as TcgGame;
              changeFormat(game, defaultFormatForGame(game));
            }}
            className="h-10 rounded-xl border border-white/10 bg-[#080812] px-2 text-xs font-bold text-white"
          >
            <option value="magic">Magic</option>
            <option value="pokemon_tcg">Pokemon TCG</option>
            <option value="yugioh">Yu-Gi-Oh</option>
            <option value="custom">Custom</option>
          </select>
          <select value={deck.format} onChange={(event) => changeFormat(deck.game, event.target.value as DeckFormat)} className="h-10 rounded-xl border border-white/10 bg-[#080812] px-2 text-xs font-bold text-white">
            {deckRulesRegistry.filter((rule) => rule.game === deck.game).map((rule) => <option key={rule.id} value={rule.format}>{rule.label}</option>)}
          </select>
        </div>
      )}

      {validation && (
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.035] p-3">
          <div className="text-3xl font-black text-white">{validation.totalCards}</div>
          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">Total Cards</div>
          <div className={`mt-2 text-xs font-black ${validation.valid ? 'text-emerald-200' : 'text-rose-200'}`}>
            {validation.valid ? 'Valid so far' : `${validation.errors.length} rule issue(s)`}
          </div>
        </div>
      )}

      <div className="mt-4 space-y-2">
        {deck?.cards.length ? deck.cards.map((card) => (
          <div key={card.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
            <div className="flex gap-3">
              {card.imageUrl && <img src={card.imageUrl} alt={card.name} className="h-16 w-12 rounded-lg object-cover object-top" />}
              <div className="min-w-0 flex-1">
                <div className="line-clamp-2 text-sm font-black text-white">{card.name}</div>
                <p className="mt-1 line-clamp-1 text-[11px] font-semibold text-gray-500">{String(card.metadata?.typeLine || card.metadata?.setName || '')}</p>
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between gap-2">
              <button onClick={() => updateQuantity(card.id, -1, card.quantity)} className="h-8 w-8 rounded-lg border border-white/10 bg-white/5 font-black">-</button>
              <span className="text-sm font-black text-amber-100">{card.quantity}</span>
              <button onClick={() => updateQuantity(card.id, 1, card.quantity)} className="h-8 w-8 rounded-lg border border-white/10 bg-white/5 font-black">+</button>
              <button onClick={() => removeCard(card.id)} className="h-8 rounded-lg border border-rose-300/15 bg-rose-500/10 px-3 text-[10px] font-black text-rose-100">Remove</button>
            </div>
          </div>
        )) : <p className="rounded-2xl border border-white/10 bg-white/[0.035] p-3 text-sm text-gray-400">Add cards from the gallery.</p>}
      </div>

      {validation && (
        <div className="mt-4 space-y-2">
          {[...validation.errors, ...validation.warnings].slice(0, 5).map((message) => (
            <p key={message} className="rounded-xl border border-white/10 bg-white/[0.035] p-2 text-xs leading-5 text-gray-300">{message}</p>
          ))}
        </div>
      )}

      {deck && (
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button onClick={favoriteDeck} className="rounded-2xl border border-amber-300/20 bg-amber-500/10 px-4 py-3 text-xs font-black text-amber-100 hover:bg-amber-500/20">{deck.isFavorite ? 'Favorited' : 'Favorite'}</button>
          <button onClick={clearDeck} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-black text-gray-200 hover:bg-white/10">Clear</button>
          <button onClick={deleteDeck} className="col-span-2 rounded-2xl border border-rose-300/15 bg-rose-500/10 px-4 py-3 text-xs font-black text-rose-100 hover:bg-rose-500/20">Delete Deck</button>
        </div>
      )}
    </aside>
  );
};
