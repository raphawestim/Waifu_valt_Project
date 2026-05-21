import type { PokemonSearchResult, ScryfallSearchResult } from '../../areas/games/types/games.types';
import type { MangaAnimeSearchResult } from '../../areas/manga/types/manga.types';
import type { CampaignSession, UserCampaign, UserRpgCharacter } from '../../areas/rpg/types/rpg.types';

export type DeckGame = 'magic' | 'pokemon_tcg' | 'yugioh' | 'custom';
export type DeckCardSource = 'scryfall' | 'apitcg' | 'custom';
export type GameLibrarySource = 'rawg' | 'igdb' | 'custom';
export type GameLibraryStatus =
  | 'never_played'
  | 'plan_to_play'
  | 'wishlist'
  | 'playing'
  | 'finished'
  | 'completed'
  | 'platinum';
export type MangaLibraryStatus = 'favorite' | 'want_to_read' | 'reading' | 'completed' | 'paused' | 'dropped';
export type MangaLibrarySource = 'anilist' | 'mangadex' | 'jikan' | 'kitsu' | 'custom';

export interface DeckCard {
  id: string;
  source: DeckCardSource;
  externalId: string;
  name: string;
  imageUrl?: string;
  quantity: number;
  metadata?: Record<string, unknown>;
}

export interface UserDeck {
  id: string;
  userId: string;
  name: string;
  description?: string;
  game: DeckGame;
  cards: DeckCard[];
  tags: string[];
  isFavorite: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PokemonGroupItem {
  id: string;
  pokemonId: number;
  name: string;
  spriteUrl?: string;
  types: string[];
  abilities?: string[];
  notes?: string;
}

export interface PokemonGroup {
  id: string;
  userId: string;
  name: string;
  description?: string;
  pokemon: PokemonGroupItem[];
  tags: string[];
  isFavorite: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserGame {
  id: string;
  userId: string;
  source: GameLibrarySource;
  externalId: string;
  title: string;
  coverUrl?: string;
  platforms: string[];
  selectedPlatform?: string;
  releaseDate?: string;
  personalStatus: GameLibraryStatus;
  isFavorite: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserMangaItem {
  id: string;
  userId: string;
  source: MangaLibrarySource;
  externalId: string;
  title: string;
  coverUrl?: string;
  bannerUrl?: string;
  authors?: string[];
  genres?: string[];
  status: MangaLibraryStatus;
  currentChapter?: number;
  totalChapters?: number;
  personalRating?: number;
  notes?: string;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_PREFIX = 'the-valt:user-collections';

const now = () => new Date().toISOString();
const makeId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
const storageKey = (userId: string, collection: string) => `${STORAGE_PREFIX}:${userId}:${collection}`;

function readCollection<T>(userId: string, collection: string): T[] {
  try {
    const raw = localStorage.getItem(storageKey(userId, collection));
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function writeCollection<T>(userId: string, collection: string, items: T[]): void {
  localStorage.setItem(storageKey(userId, collection), JSON.stringify(items));
}

function upsertById<T extends { id: string; updatedAt: string }>(items: T[], item: T): T[] {
  const exists = items.some((entry) => entry.id === item.id);
  const updatedItem = { ...item, updatedAt: now() };
  return exists ? items.map((entry) => (entry.id === item.id ? updatedItem : entry)) : [updatedItem, ...items];
}

export function getUserDecks(userId: string): UserDeck[] {
  return readCollection<UserDeck>(userId, 'decks');
}

export function saveUserDeck(userId: string, deck: UserDeck): UserDeck[] {
  const decks = upsertById(getUserDecks(userId), deck);
  writeCollection(userId, 'decks', decks);
  return decks;
}

export function deleteUserDeck(userId: string, deckId: string): UserDeck[] {
  const decks = getUserDecks(userId).filter((deck) => deck.id !== deckId);
  writeCollection(userId, 'decks', decks);
  return decks;
}

export function createUserDeck(userId: string, name: string, game: DeckGame = 'magic'): UserDeck {
  return {
    id: makeId('deck'),
    userId,
    name,
    game,
    cards: [],
    tags: [],
    isFavorite: false,
    createdAt: now(),
    updatedAt: now(),
  };
}

export function addScryfallCardToDeck(userId: string, card: ScryfallSearchResult, deckId?: string): UserDeck[] {
  const decks = getUserDecks(userId);
  const targetDeck = decks.find((deck) => deck.id === deckId) || decks[0] || createUserDeck(userId, 'Quick Magic Deck', 'magic');
  const cardId = `scryfall-${card.id}`;
  const nextDeck: UserDeck = {
    ...targetDeck,
    cards: targetDeck.cards.some((entry) => entry.id === cardId)
      ? targetDeck.cards.map((entry) => (entry.id === cardId ? { ...entry, quantity: entry.quantity + 1 } : entry))
      : [
          ...targetDeck.cards,
          {
            id: cardId,
            source: 'scryfall',
            externalId: card.id,
            name: card.name,
            imageUrl: card.imageUrl,
            quantity: 1,
            metadata: {
              setName: card.setName,
              typeLine: card.typeLine,
              rarity: card.rarity,
            },
          },
        ],
  };

  return saveUserDeck(userId, nextDeck);
}

export function getPokemonGroups(userId: string): PokemonGroup[] {
  return readCollection<PokemonGroup>(userId, 'pokemon-groups');
}

export function savePokemonGroup(userId: string, group: PokemonGroup): PokemonGroup[] {
  const groups = upsertById(getPokemonGroups(userId), group);
  writeCollection(userId, 'pokemon-groups', groups);
  return groups;
}

export function deletePokemonGroup(userId: string, groupId: string): PokemonGroup[] {
  const groups = getPokemonGroups(userId).filter((group) => group.id !== groupId);
  writeCollection(userId, 'pokemon-groups', groups);
  return groups;
}

export function createPokemonGroup(userId: string, name: string): PokemonGroup {
  return {
    id: makeId('pokemon-group'),
    userId,
    name,
    pokemon: [],
    tags: [],
    isFavorite: false,
    createdAt: now(),
    updatedAt: now(),
  };
}

export function addPokemonToGroup(userId: string, pokemon: PokemonSearchResult, groupId?: string): PokemonGroup[] {
  const groups = getPokemonGroups(userId);
  const targetGroup = groups.find((group) => group.id === groupId) || groups[0] || createPokemonGroup(userId, 'Main Team');
  const itemId = `pokeapi-${pokemon.id}`;
  const nextGroup: PokemonGroup = {
    ...targetGroup,
    pokemon: targetGroup.pokemon.some((entry) => entry.id === itemId)
      ? targetGroup.pokemon
      : [
          ...targetGroup.pokemon,
          {
            id: itemId,
            pokemonId: pokemon.id,
            name: pokemon.name,
            spriteUrl: pokemon.spriteUrl,
            types: pokemon.types,
            abilities: pokemon.abilities,
          },
        ],
  };

  return savePokemonGroup(userId, nextGroup);
}

export function getUserGames(userId: string): UserGame[] {
  return readCollection<UserGame>(userId, 'games-library');
}

export function saveUserGame(userId: string, game: UserGame): UserGame[] {
  const games = upsertById(getUserGames(userId), game);
  writeCollection(userId, 'games-library', games);
  return games;
}

export function deleteUserGame(userId: string, gameId: string): UserGame[] {
  const games = getUserGames(userId).filter((game) => game.id !== gameId);
  writeCollection(userId, 'games-library', games);
  return games;
}

export function getUserMangaLibrary(userId: string): UserMangaItem[] {
  return readCollection<UserMangaItem>(userId, 'manga-library');
}

export function saveUserMangaItem(userId: string, item: UserMangaItem): UserMangaItem[] {
  const items = upsertById(getUserMangaLibrary(userId), item);
  writeCollection(userId, 'manga-library', items);
  return items;
}

export function deleteUserMangaItem(userId: string, itemId: string): UserMangaItem[] {
  const items = getUserMangaLibrary(userId).filter((item) => item.id !== itemId);
  writeCollection(userId, 'manga-library', items);
  return items;
}

export function mangaResultToLibraryItem(
  userId: string,
  result: MangaAnimeSearchResult,
  status: MangaLibraryStatus = 'want_to_read',
): UserMangaItem {
  return {
    id: `${result.source}-${result.id}`,
    userId,
    source: result.source,
    externalId: result.id,
    title: result.title,
    coverUrl: result.imageUrl,
    status,
    isFavorite: status === 'favorite',
    createdAt: now(),
    updatedAt: now(),
  };
}

export function getUserRpgCharacters(userId: string): UserRpgCharacter[] {
  return readCollection<UserRpgCharacter>(userId, 'rpg-characters');
}

export function saveUserRpgCharacter(userId: string, character: UserRpgCharacter): UserRpgCharacter[] {
  const characters = upsertById(getUserRpgCharacters(userId), character);
  writeCollection(userId, 'rpg-characters', characters);
  return characters;
}

export function deleteUserRpgCharacter(userId: string, characterId: string): UserRpgCharacter[] {
  const characters = getUserRpgCharacters(userId).filter((character) => character.id !== characterId);
  writeCollection(userId, 'rpg-characters', characters);
  return characters;
}

export function createUserRpgCharacter(userId: string, name: string): UserRpgCharacter {
  return {
    id: makeId('rpg-character'),
    userId,
    name,
    level: 1,
    attributes: {
      strength: 10,
      dexterity: 10,
      constitution: 10,
      intelligence: 10,
      wisdom: 10,
      charisma: 10,
    },
    createdAt: now(),
    updatedAt: now(),
  };
}

export function getUserCampaigns(userId: string): UserCampaign[] {
  return readCollection<UserCampaign>(userId, 'rpg-campaigns');
}

export function saveUserCampaign(userId: string, campaign: UserCampaign): UserCampaign[] {
  const campaigns = upsertById(getUserCampaigns(userId), campaign);
  writeCollection(userId, 'rpg-campaigns', campaigns);
  return campaigns;
}

export function deleteUserCampaign(userId: string, campaignId: string): UserCampaign[] {
  const campaigns = getUserCampaigns(userId).filter((campaign) => campaign.id !== campaignId);
  writeCollection(userId, 'rpg-campaigns', campaigns);
  return campaigns;
}

export function createUserCampaign(userId: string, name: string): UserCampaign {
  return {
    id: makeId('campaign'),
    userId,
    name,
    system: 'dnd5e',
    characterIds: [],
    createdAt: now(),
    updatedAt: now(),
  };
}

export function getCampaignSessions(userId: string, campaignId: string): CampaignSession[] {
  return readCollection<CampaignSession>(userId, `rpg-campaign-sessions:${campaignId}`);
}

export function saveCampaignSession(userId: string, campaignId: string, session: CampaignSession): CampaignSession[] {
  const sessions = upsertById(getCampaignSessions(userId, campaignId), session);
  writeCollection(userId, `rpg-campaign-sessions:${campaignId}`, sessions);
  return sessions;
}
