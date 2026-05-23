export type TcgGame = 'magic' | 'pokemon_tcg' | 'yugioh' | 'custom';

export type DeckFormat =
  | 'standard'
  | 'commander'
  | 'modern'
  | 'pioneer'
  | 'pokemon_standard'
  | 'yugioh_advanced'
  | 'custom';

export interface ScryfallCard {
  id: string;
  name: string;
  mana_cost?: string;
  cmc?: number;
  type_line?: string;
  oracle_text?: string;
  colors?: string[];
  color_identity?: string[];
  set?: string;
  set_name?: string;
  rarity?: string;
  artist?: string;
  image_uris?: {
    small?: string;
    normal?: string;
    large?: string;
    png?: string;
  };
  prices?: {
    usd?: string | null;
    eur?: string | null;
    tix?: string | null;
  };
  legalities?: Record<string, string>;
  released_at?: string;
  scryfall_uri?: string;
}

export interface DeckCard {
  id: string;
  source: 'scryfall' | 'apitcg' | 'custom';
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
  game: TcgGame;
  format: DeckFormat;
  cards: DeckCard[];
  tags: string[];
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DeckValidationResult {
  valid: boolean;
  warnings: string[];
  errors: string[];
  totalCards: number;
}

export interface DeckStats {
  totalDecks: number;
  favoriteDecks: number;
  totalCards: number;
}

export interface CardSearchFilters {
  color?: string;
  type?: string;
  rarity?: string;
  set?: string;
  manaValue?: string;
  format?: string;
  page?: number;
}
