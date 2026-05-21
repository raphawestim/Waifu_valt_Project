import type { UserDeck } from '../../../shared/storage/userCollectionsService';

export interface DeckRulePreset {
  id: string;
  game: 'magic' | 'pokemon_tcg' | 'yugioh' | 'custom';
  format: string;
  minCards?: number;
  maxCards?: number;
  exactCards?: number;
  maxCopiesPerCard?: number;
  singleton?: boolean;
  requiresCommander?: boolean;
  notes: string[];
}

export interface DeckValidationResult {
  valid: boolean;
  warnings: string[];
  errors: string[];
  totalCards: number;
  limits: Record<string, unknown>;
}

export const deckRulesRegistry: DeckRulePreset[] = [
  {
    id: 'magic-standard',
    game: 'magic',
    format: 'Standard',
    minCards: 60,
    maxCopiesPerCard: 4,
    notes: ['Minimum 60 cards.', 'Maximum 4 copies per card, except basic lands.'],
  },
  {
    id: 'magic-commander',
    game: 'magic',
    format: 'Commander',
    exactCards: 100,
    singleton: true,
    requiresCommander: true,
    notes: ['Exactly 100 cards.', 'Singleton format except basic lands.', 'Commander validation is MVP/planned.'],
  },
  {
    id: 'pokemon-tcg',
    game: 'pokemon_tcg',
    format: 'Standard',
    exactCards: 60,
    notes: ['MVP validates the 60-card deck size. Full Pokemon TCG rules are planned.'],
  },
  {
    id: 'yugioh-main',
    game: 'yugioh',
    format: 'Main Deck',
    minCards: 40,
    maxCards: 60,
    notes: ['Main deck must contain 40 to 60 cards. Extra deck validation is planned.'],
  },
  {
    id: 'custom',
    game: 'custom',
    format: 'Custom',
    notes: ['Custom deck rules are user-defined in a future editor.'],
  },
];

const isBasicLand = (name: string) => ['plains', 'island', 'swamp', 'mountain', 'forest', 'wastes'].includes(name.toLowerCase());

export function validateDeck(deck: UserDeck, rulePreset: DeckRulePreset): DeckValidationResult {
  const totalCards = deck.cards.reduce((sum, card) => sum + card.quantity, 0);
  const warnings: string[] = [];
  const errors: string[] = [];

  if (rulePreset.exactCards && totalCards !== rulePreset.exactCards) {
    errors.push(`${rulePreset.format} requires exactly ${rulePreset.exactCards} cards.`);
  }
  if (rulePreset.minCards && totalCards < rulePreset.minCards) {
    errors.push(`${rulePreset.format} requires at least ${rulePreset.minCards} cards.`);
  }
  if (rulePreset.maxCards && totalCards > rulePreset.maxCards) {
    errors.push(`${rulePreset.format} allows at most ${rulePreset.maxCards} cards.`);
  }
  if (rulePreset.singleton) {
    deck.cards.forEach((card) => {
      if (card.quantity > 1 && !isBasicLand(card.name)) {
        errors.push(`${card.name} breaks singleton rules.`);
      }
    });
  }
  if (rulePreset.maxCopiesPerCard) {
    deck.cards.forEach((card) => {
      if (card.quantity > rulePreset.maxCopiesPerCard && !isBasicLand(card.name)) {
        errors.push(`${card.name} exceeds ${rulePreset.maxCopiesPerCard} copies.`);
      }
    });
  }
  if (rulePreset.requiresCommander) {
    warnings.push('Commander selection is planned; choose your commander in notes for now.');
  }
  if (deck.cards.length === 0) {
    warnings.push('Add cards from the gallery to start validating this deck.');
  }

  return {
    valid: errors.length === 0,
    warnings,
    errors,
    totalCards,
    limits: {
      minCards: rulePreset.minCards,
      maxCards: rulePreset.maxCards,
      exactCards: rulePreset.exactCards,
      singleton: rulePreset.singleton,
      maxCopiesPerCard: rulePreset.maxCopiesPerCard,
    },
  };
}
