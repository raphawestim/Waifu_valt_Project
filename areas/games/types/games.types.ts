export type ApiStatus = 'active' | 'planned' | 'disabled' | 'error';

export interface GameApiRegistryItem {
  id: string;
  name: string;
  category: string;
  description: string;
  status: ApiStatus;
  tags: string[];
  baseUrl?: string;
  docsUrl?: string;
  requiresApiKey?: boolean;
}

export interface ScryfallSearchResult {
  id: string;
  name: string;
  typeLine: string;
  oracleText?: string;
  imageUrl?: string;
  setName?: string;
  rarity?: string;
  sourceUrl: string;
}

export interface PokemonSearchResult {
  id: number;
  name: string;
  spriteUrl?: string;
  types: string[];
  abilities: string[];
  stats: Array<{ name: string; value: number }>;
  sourceUrl: string;
}

export type GameQuickSearchResult =
  | ({ source: 'scryfall' } & ScryfallSearchResult)
  | ({ source: 'pokeapi' } & PokemonSearchResult);

export interface RawgGenre {
  id: number;
  name: string;
  slug?: string;
}

export interface RawgPlatform {
  id: number;
  name: string;
  slug?: string;
}

export interface RawgGame {
  id: number;
  slug?: string;
  name: string;
  background_image?: string;
  backgroundImage?: string;
  released?: string;
  rating?: number;
  metacritic?: number;
  platforms: RawgPlatform[];
  genres: RawgGenre[];
}

export interface RawgGameDetails extends RawgGame {
  description_raw?: string;
  description?: string;
  website?: string;
  developers: string[];
  publishers: string[];
  stores: string[];
  screenshots?: string[];
}

export type GamePersonalStatus =
  | 'never_played'
  | 'plan_to_play'
  | 'wishlist'
  | 'playing'
  | 'finished'
  | 'completed'
  | 'platinum';

export interface UserGame {
  id: string;
  userId: string;
  source: 'rawg' | 'igdb' | 'custom';
  externalId: string;
  title: string;
  coverUrl?: string;
  platforms: string[];
  selectedPlatform?: string;
  releaseDate?: string;
  personalStatus: GamePersonalStatus;
  isFavorite: boolean;
  notes?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface SteamGameMetadata {
  appId?: string;
  storeUrl?: string;
  gridDbGameId?: string;
  coverUrl?: string;
  heroUrl?: string;
  logoUrl?: string;
  iconUrl?: string;
  preferredArtworkSource?: 'steamgriddb' | 'rawg';
}

export interface UserGameMetadata extends Record<string, unknown> {
  steam?: SteamGameMetadata;
}

export interface SteamAppSearchResult {
  id: number;
  name: string;
  tiny_image?: string;
  price?: {
    final?: number;
    currency?: string;
  };
}

export interface SteamGridDbGame {
  id: number;
  name: string;
  types?: string[];
  verified?: boolean;
}

export interface SteamGridDbArtwork {
  id: number;
  score?: number;
  style?: string;
  url: string;
  thumb?: string;
  width?: number;
  height?: number;
}

export interface GameLibraryFilter {
  status?: GamePersonalStatus | 'all';
  platform?: string;
  favoritesOnly?: boolean;
  search?: string;
}

export interface GameLibraryStats {
  total: number;
  neverPlayed: number;
  planToPlay: number;
  wishlist: number;
  playing: number;
  finished: number;
  completed: number;
  platinum: number;
  favorites: number;
}
