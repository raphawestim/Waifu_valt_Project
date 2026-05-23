import { apiDelete, apiGet, apiPatch, apiPost } from '../../../shared/services/apiClient';
import type { DeckCard, UserDeck } from '../types/tcg.types';

type DeckPayload = Pick<UserDeck, 'name' | 'description' | 'game' | 'format' | 'tags' | 'isFavorite'>;
type DeckCardPayload = Omit<DeckCard, 'id'>;

export async function getBackendDecks(): Promise<UserDeck[]> {
  const response = await apiGet<{ decks: UserDeck[] }>('/me/decks');
  return response.decks;
}

export async function getBackendDeck(deckId: string): Promise<UserDeck> {
  const response = await apiGet<{ deck: UserDeck }>(`/me/decks/${deckId}`);
  return response.deck;
}

export async function createBackendDeck(payload: Partial<DeckPayload>): Promise<UserDeck> {
  const response = await apiPost<{ deck: UserDeck }>('/me/decks', payload);
  return response.deck;
}

export async function updateBackendDeck(deckId: string, patch: Partial<DeckPayload>): Promise<UserDeck> {
  const response = await apiPatch<{ deck: UserDeck }>(`/me/decks/${deckId}`, patch);
  return response.deck;
}

export async function deleteBackendDeck(deckId: string): Promise<void> {
  await apiDelete(`/me/decks/${deckId}`);
}

export async function addBackendDeckCard(deckId: string, card: DeckCardPayload): Promise<UserDeck> {
  const response = await apiPost<{ deck: UserDeck }>(`/me/decks/${deckId}/cards`, card);
  return response.deck;
}

export async function updateBackendDeckCard(deckId: string, cardId: string, patch: Partial<DeckCardPayload>): Promise<UserDeck> {
  const response = await apiPatch<{ deck: UserDeck }>(`/me/decks/${deckId}/cards/${cardId}`, patch);
  return response.deck;
}

export async function deleteBackendDeckCard(deckId: string, cardId: string): Promise<UserDeck> {
  const response = await apiDelete<{ deck: UserDeck }>(`/me/decks/${deckId}/cards/${cardId}`);
  return response.deck;
}
