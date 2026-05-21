import React from 'react';
import { saveUserDeck, type UserDeck } from '../../../shared/storage/userCollectionsService';
import { deckRulesRegistry, validateDeck } from '../data/deckRulesRegistry';

interface DeckBuilderSidebarProps {
  userId?: string;
  deck?: UserDeck;
  decks: UserDeck[];
  onDecksChange: (decks: UserDeck[]) => void;
}

export const DeckBuilderSidebar: React.FC<DeckBuilderSidebarProps> = ({ userId, deck, decks, onDecksChange }) => {
  const preset = deckRulesRegistry.find((rule) => rule.game === (deck?.game || 'magic')) || deckRulesRegistry[0];
  const validation = deck ? validateDeck(deck, preset) : null;

  const updateQuantity = (cardId: string, delta: number) => {
    if (!userId || !deck) return;
    const cards = deck.cards
      .map((card) => (card.id === cardId ? { ...card, quantity: Math.max(0, card.quantity + delta) } : card))
      .filter((card) => card.quantity > 0);
    onDecksChange(saveUserDeck(userId, { ...deck, cards }));
  };

  return (
    <aside className="min-w-0 rounded-3xl border border-amber-300/15 bg-black/35 p-4 shadow-2xl shadow-black/30 backdrop-blur-xl lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto">
      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-amber-200">Deck Builder</p>
      <h2 className="mt-2 text-2xl font-black text-white">{deck?.name || 'No active deck'}</h2>
      <p className="mt-2 text-xs font-bold text-gray-500">{preset.game.replace('_', ' ')} · {preset.format}</p>
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
            <div className="text-sm font-black text-white">{card.name}</div>
            <div className="mt-2 flex items-center justify-between gap-2">
              <button onClick={() => updateQuantity(card.id, -1)} className="h-8 w-8 rounded-lg border border-white/10 bg-white/5 font-black">-</button>
              <span className="text-sm font-black text-amber-100">{card.quantity}</span>
              <button onClick={() => updateQuantity(card.id, 1)} className="h-8 w-8 rounded-lg border border-white/10 bg-white/5 font-black">+</button>
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
      <button
        onClick={() => userId && deck && onDecksChange(saveUserDeck(userId, { ...deck, cards: [] }))}
        className="mt-4 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-black text-gray-200 hover:bg-white/10"
      >
        Clear Deck
      </button>
    </aside>
  );
};
