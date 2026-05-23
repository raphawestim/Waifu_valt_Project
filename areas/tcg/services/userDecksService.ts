import {
  addGlobalFavorite,
  getGlobalFavorites,
  removeGlobalFavorite,
} from '../../../services/userProfileService';
import { ApiHttpError, ApiNetworkError, checkApiHealth, getAuthToken } from '../../../shared/services/apiClient';
import { getBackendFavorites, removeBackendFavorite } from '../../../shared/services/favoritesClient';
import {
  addBackendDeckCard,
  createBackendDeck,
  deleteBackendDeck,
  deleteBackendDeckCard,
  getBackendDecks,
  updateBackendDeck,
  updateBackendDeckCard,
} from './tcgClient';
import type { DeckCard, DeckStats, ScryfallCard, TcgGame, UserDeck, DeckFormat } from '../types/tcg.types';

const USER_DECKS_KEY = 'thevault.userDecks';
const AUTH_SESSION_KEY = 'thevault.auth.session';
const now = () => new Date().toISOString();
const storageKey = (userId: string) => `${USER_DECKS_KEY}:${userId}`;

interface StoredAuthSession {
  mode?: 'backend' | 'local';
  token?: string;
  user?: { id?: string; username?: string; authMode?: 'backend' | 'local'; token?: string };
}

function readDecks(userId: string): UserDeck[] {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    return raw ? (JSON.parse(raw) as UserDeck[]) : [];
  } catch {
    return [];
  }
}

function writeDecks(userId: string, decks: UserDeck[]): UserDeck[] {
  localStorage.setItem(storageKey(userId), JSON.stringify(decks));
  return decks;
}

function readAuthSession(): StoredAuthSession | null {
  try {
    const raw = localStorage.getItem(AUTH_SESSION_KEY);
    return raw ? (JSON.parse(raw) as StoredAuthSession) : null;
  } catch {
    return null;
  }
}

function getAccountMode(): 'backend' | 'local' | null {
  const session = readAuthSession();
  if (session?.mode) return session.mode;
  if (session?.user?.authMode) return session.user.authMode;
  if (session?.token || getAuthToken()) return 'backend';
  return session?.user ? 'local' : null;
}

function hasBackendSession(): boolean {
  return getAccountMode() === 'backend' && Boolean(getAuthToken());
}

export async function shouldUseBackendStorage(): Promise<boolean> {
  if (!hasBackendSession()) return false;
  const health = await checkApiHealth();
  return Boolean(health?.ok);
}

function backendFallbackWarning(error: unknown, collectionLabel: string): string {
  if (error instanceof ApiNetworkError) return 'Backend is unreachable. Showing local fallback.';
  if (error instanceof ApiHttpError && (error.status === 401 || error.status === 403)) return 'Session expired. Please login again.';
  if (error instanceof ApiHttpError && error.status >= 500) return 'Backend error while loading collection. Showing local fallback.';
  return `${collectionLabel} backend could not be loaded. Showing local fallback.`;
}

function favoriteDeckId(deck: UserDeck) {
  return `tcg:deck:local:${deck.id}`;
}

function favoriteCardId(card: ScryfallCard) {
  return `tcg:card:scryfall:${card.id}`;
}

function syncDeckFavorite(userId: string, deck: UserDeck) {
  const id = favoriteDeckId(deck);
  if (deck.isFavorite) {
    addGlobalFavorite(userId, {
      id,
      vault: 'tcg',
      type: 'deck',
      source: 'local',
      externalId: deck.id,
      title: deck.name,
      metadata: { game: deck.game, format: deck.format, totalCards: deck.cards.reduce((sum, card) => sum + card.quantity, 0) },
    });
    return;
  }
  if (getGlobalFavorites(userId).some((favorite) => favorite.id === id)) removeGlobalFavorite(userId, id);
  removeBackendTcgFavorite('deck', 'local', deck.id);
}

function removeBackendTcgFavorite(type: 'deck' | 'card', source: string, externalId: string): void {
  if (!hasBackendSession()) return;
  void getBackendFavorites()
    .then((response) => {
      const favorites = (response as { favorites?: Array<{ id: string; vault: string; type: string; source?: string; externalId?: string }> }).favorites || [];
      const match = favorites.find(
        (favorite) =>
          favorite.vault === 'tcg' &&
          favorite.type === type &&
          favorite.source === source &&
          favorite.externalId === externalId,
      );
      if (match) return removeBackendFavorite(match.id);
      return undefined;
    })
    .catch(() => undefined);
}

function replaceStoredDeck(userId: string, previous: UserDeck, next: UserDeck): UserDeck[] {
  const decks = getUserDecks(userId);
  const withoutPrevious = decks.filter((entry) => entry.id !== previous.id);
  return writeDecks(userId, [next, ...withoutPrevious]);
}

export function addCardGlobalFavorite(userId: string, card: ScryfallCard): void {
  addGlobalFavorite(userId, {
    id: favoriteCardId(card),
    vault: 'tcg',
    type: 'card',
    source: 'scryfall',
    externalId: card.id,
    title: card.name,
    thumbnailUrl: card.image_uris?.normal || card.image_uris?.small,
    metadata: {
      setName: card.set_name,
      typeLine: card.type_line,
      rarity: card.rarity,
      manaCost: card.mana_cost,
    },
  });
}

export function removeCardGlobalFavorite(userId: string, cardId: string): void {
  removeGlobalFavorite(userId, `tcg:card:scryfall:${cardId}`);
  removeBackendTcgFavorite('card', 'scryfall', cardId);
}

export function isCardGlobalFavorite(userId: string, cardId: string): boolean {
  return getGlobalFavorites(userId).some((favorite) => favorite.id === `tcg:card:scryfall:${cardId}`);
}

export function getUserDecks(userId: string): UserDeck[] {
  return readDecks(userId);
}

export async function loadUserDecks(userId: string): Promise<{ decks: UserDeck[]; storage: 'backend' | 'local'; warning?: string }> {
  if (getAccountMode() !== 'backend') return { decks: getUserDecks(userId), storage: 'local' };
  if (!getAuthToken()) return { decks: getUserDecks(userId), storage: 'local', warning: 'Missing auth token. Please login again.' };

  try {
    const decks = await getBackendDecks();
    writeDecks(userId, decks);
    return { decks, storage: 'backend' };
  } catch (error) {
    return {
      decks: getUserDecks(userId),
      storage: 'local',
      warning: backendFallbackWarning(error, 'Deck'),
    };
  }
}

export function getUserDeck(userId: string, deckId: string): UserDeck | null {
  return getUserDecks(userId).find((deck) => deck.id === deckId) || null;
}

export function createUserDeck(
  userId: string,
  payload: Partial<Pick<UserDeck, 'name' | 'description' | 'game' | 'format' | 'tags'>> = {},
): UserDeck {
  const timestamp = now();
  const deck: UserDeck = {
    id: `deck-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    userId,
    name: payload.name || 'New TCG Deck',
    description: payload.description,
    game: payload.game || 'magic',
    format: payload.format || 'standard',
    cards: [],
    tags: payload.tags || [],
    isFavorite: false,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  saveUserDeck(userId, deck);
  return deck;
}

export async function createUserDeckHybrid(
  userId: string,
  payload: Partial<Pick<UserDeck, 'name' | 'description' | 'game' | 'format' | 'tags'>> = {},
): Promise<{ deck: UserDeck; storage: 'backend' | 'local'; warning?: string }> {
  const localDeck = createUserDeck(userId, payload);
  if (!hasBackendSession()) return { deck: localDeck, storage: 'local' };

  try {
    const backendDeck = await createBackendDeck({
      name: localDeck.name,
      description: localDeck.description,
      game: localDeck.game,
      format: localDeck.format,
      tags: localDeck.tags,
      isFavorite: localDeck.isFavorite,
    });
    replaceStoredDeck(userId, localDeck, backendDeck);
    return { deck: backendDeck, storage: 'backend' };
  } catch (error) {
    return {
      deck: localDeck,
      storage: 'local',
      warning: error instanceof ApiNetworkError
        ? 'Backend is offline. Changes may use local fallback.'
        : 'Deck could not be created in backend. Kept local fallback.',
    };
  }
}

export function saveUserDeck(userId: string, deck: UserDeck): UserDeck {
  const updated = { ...deck, userId, updatedAt: now() };
  const decks = getUserDecks(userId);
  const nextDecks = decks.some((entry) => entry.id === updated.id)
    ? decks.map((entry) => (entry.id === updated.id ? updated : entry))
    : [updated, ...decks];
  writeDecks(userId, nextDecks);
  syncDeckFavorite(userId, updated);
  return updated;
}

export async function saveUserDeckHybrid(userId: string, deck: UserDeck): Promise<{ deck: UserDeck; storage: 'backend' | 'local'; warning?: string }> {
  const localDeck = saveUserDeck(userId, deck);
  if (!hasBackendSession()) return { deck: localDeck, storage: 'local' };

  try {
    const backendDeck = await updateBackendDeck(localDeck.id, {
      name: localDeck.name,
      description: localDeck.description,
      game: localDeck.game,
      format: localDeck.format,
      tags: localDeck.tags,
      isFavorite: localDeck.isFavorite,
    });
    replaceStoredDeck(userId, localDeck, backendDeck);
    syncDeckFavorite(userId, backendDeck);
    return { deck: backendDeck, storage: 'backend' };
  } catch (error) {
    return {
      deck: localDeck,
      storage: 'local',
      warning: error instanceof ApiNetworkError
        ? 'Backend is offline. Changes may use local fallback.'
        : 'Deck could not be saved to backend. Kept local fallback.',
    };
  }
}

export function updateUserDeck(userId: string, deckId: string, patch: Partial<UserDeck>): UserDeck {
  const deck = getUserDeck(userId, deckId);
  if (!deck) throw new Error('Deck not found.');
  return saveUserDeck(userId, { ...deck, ...patch, id: deck.id, userId });
}

export async function updateUserDeckHybrid(
  userId: string,
  deckId: string,
  patch: Partial<UserDeck>,
): Promise<{ deck: UserDeck; storage: 'backend' | 'local'; warning?: string }> {
  const updated = updateUserDeck(userId, deckId, patch);
  return saveUserDeckHybrid(userId, updated);
}

export function deleteUserDeck(userId: string, deckId: string): void {
  const deck = getUserDeck(userId, deckId);
  writeDecks(userId, getUserDecks(userId).filter((entry) => entry.id !== deckId));
  if (deck) removeGlobalFavorite(userId, favoriteDeckId(deck));
}

export async function deleteUserDeckHybrid(userId: string, deckId: string): Promise<{ storage: 'backend' | 'local'; warning?: string }> {
  const deck = getUserDeck(userId, deckId);
  deleteUserDeck(userId, deckId);

  if (!deck || !hasBackendSession()) return { storage: 'local' };

  try {
    await deleteBackendDeck(deck.id);
    return { storage: 'backend' };
  } catch (error) {
    return {
      storage: 'local',
      warning: error instanceof ApiNetworkError
        ? 'Backend is offline. Changes may use local fallback.'
        : 'Deck was removed locally, but backend removal could not be confirmed.',
    };
  }
}

export function scryfallCardToDeckCard(card: ScryfallCard): DeckCard {
  return {
    id: `scryfall-${card.id}`,
    source: 'scryfall',
    externalId: card.id,
    name: card.name,
    imageUrl: card.image_uris?.normal || card.image_uris?.small,
    quantity: 1,
    metadata: {
      manaCost: card.mana_cost,
      cmc: card.cmc,
      typeLine: card.type_line,
      setName: card.set_name,
      rarity: card.rarity,
      artist: card.artist,
    },
  };
}

export function addCardToDeck(userId: string, deckId: string, card: ScryfallCard): UserDeck {
  const deck = getUserDeck(userId, deckId);
  if (!deck) throw new Error('Deck not found.');
  const deckCard = scryfallCardToDeckCard(card);
  const cards = deck.cards.some((entry) => entry.source === deckCard.source && entry.externalId === deckCard.externalId)
    ? deck.cards.map((entry) => (
      entry.source === deckCard.source && entry.externalId === deckCard.externalId
        ? { ...entry, quantity: entry.quantity + 1 }
        : entry
    ))
    : [...deck.cards, deckCard];
  return saveUserDeck(userId, { ...deck, cards });
}

export async function addCardToDeckHybrid(
  userId: string,
  deckId: string,
  card: ScryfallCard,
): Promise<{ deck: UserDeck; storage: 'backend' | 'local'; warning?: string }> {
  const deck = addCardToDeck(userId, deckId, card);
  if (!hasBackendSession()) return { deck, storage: 'local' };

  try {
    const deckCard = scryfallCardToDeckCard(card);
    const backendDeck = await addBackendDeckCard(deckId, {
      source: deckCard.source,
      externalId: deckCard.externalId,
      name: deckCard.name,
      imageUrl: deckCard.imageUrl,
      quantity: 1,
      metadata: deckCard.metadata,
    });
    replaceStoredDeck(userId, deck, backendDeck);
    return { deck: backendDeck, storage: 'backend' };
  } catch (error) {
    return {
      deck,
      storage: 'local',
      warning: error instanceof ApiNetworkError
        ? 'Backend is offline. Changes may use local fallback.'
        : 'Card could not be added to backend deck. Kept local fallback.',
    };
  }
}

export function removeCardFromDeck(userId: string, deckId: string, deckCardId: string): UserDeck {
  const deck = getUserDeck(userId, deckId);
  if (!deck) throw new Error('Deck not found.');
  return saveUserDeck(userId, { ...deck, cards: deck.cards.filter((card) => card.id !== deckCardId) });
}

export async function removeCardFromDeckHybrid(
  userId: string,
  deckId: string,
  deckCardId: string,
): Promise<{ deck: UserDeck; storage: 'backend' | 'local'; warning?: string }> {
  const deck = removeCardFromDeck(userId, deckId, deckCardId);
  if (!hasBackendSession()) return { deck, storage: 'local' };

  try {
    const backendDeck = await deleteBackendDeckCard(deckId, deckCardId);
    replaceStoredDeck(userId, deck, backendDeck);
    return { deck: backendDeck, storage: 'backend' };
  } catch (error) {
    return {
      deck,
      storage: 'local',
      warning: error instanceof ApiNetworkError
        ? 'Backend is offline. Changes may use local fallback.'
        : 'Card could not be removed from backend deck. Kept local fallback.',
    };
  }
}

export function updateDeckCardQuantity(userId: string, deckId: string, deckCardId: string, quantity: number): UserDeck {
  const deck = getUserDeck(userId, deckId);
  if (!deck) throw new Error('Deck not found.');
  const cards = deck.cards
    .map((card) => (card.id === deckCardId ? { ...card, quantity: Math.max(0, quantity) } : card))
    .filter((card) => card.quantity > 0);
  return saveUserDeck(userId, { ...deck, cards });
}

export async function updateDeckCardQuantityHybrid(
  userId: string,
  deckId: string,
  deckCardId: string,
  quantity: number,
): Promise<{ deck: UserDeck; storage: 'backend' | 'local'; warning?: string }> {
  const deck = updateDeckCardQuantity(userId, deckId, deckCardId, quantity);
  if (!hasBackendSession()) return { deck, storage: 'local' };

  try {
    const backendDeck = quantity <= 0
      ? await deleteBackendDeckCard(deckId, deckCardId)
      : await updateBackendDeckCard(deckId, deckCardId, { quantity });
    replaceStoredDeck(userId, deck, backendDeck);
    return { deck: backendDeck, storage: 'backend' };
  } catch (error) {
    return {
      deck,
      storage: 'local',
      warning: error instanceof ApiNetworkError
        ? 'Backend is offline. Changes may use local fallback.'
        : 'Card quantity could not be saved to backend. Kept local fallback.',
    };
  }
}

export function toggleDeckFavorite(userId: string, deckId: string): UserDeck {
  const deck = getUserDeck(userId, deckId);
  if (!deck) throw new Error('Deck not found.');
  return saveUserDeck(userId, { ...deck, isFavorite: !deck.isFavorite });
}

export async function toggleDeckFavoriteHybrid(userId: string, deckId: string): Promise<{ deck: UserDeck; storage: 'backend' | 'local'; warning?: string }> {
  const deck = toggleDeckFavorite(userId, deckId);
  return saveUserDeckHybrid(userId, deck);
}

export function updateDeckFormat(userId: string, deckId: string, game: TcgGame, format: DeckFormat): UserDeck {
  return updateUserDeck(userId, deckId, { game, format });
}

export async function updateDeckFormatHybrid(
  userId: string,
  deckId: string,
  game: TcgGame,
  format: DeckFormat,
): Promise<{ deck: UserDeck; storage: 'backend' | 'local'; warning?: string }> {
  return updateUserDeckHybrid(userId, deckId, { game, format });
}

export function getDeckStats(userId: string): DeckStats {
  const decks = getUserDecks(userId);
  return {
    totalDecks: decks.length,
    favoriteDecks: decks.filter((deck) => deck.isFavorite).length,
    totalCards: decks.reduce((total, deck) => total + deck.cards.reduce((sum, card) => sum + card.quantity, 0), 0),
  };
}
