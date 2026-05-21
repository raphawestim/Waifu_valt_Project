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
  slug: string;
}

export interface RawgPlatform {
  id: number;
  name: string;
  slug: string;
}

export interface RawgGame {
  id: number;
  name: string;
  slug: string;
  backgroundImage?: string;
  released?: string;
  rating?: number;
  metacritic?: number;
  platforms: RawgPlatform[];
  genres: RawgGenre[];
}

export interface RawgGameDetails extends RawgGame {
  description?: string;
  website?: string;
  developers: string[];
  publishers: string[];
  stores: string[];
}
