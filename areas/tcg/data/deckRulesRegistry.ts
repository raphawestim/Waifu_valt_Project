import type { DeckFormat, DeckValidationResult, TcgGame, UserDeck } from '../types/tcg.types';

export interface DeckRulePreset {
  id: string;
  label: string;
  game: TcgGame;
  format: DeckFormat;
  minCards?: number;
  maxCards?: number;
  exactCards?: number;
  maxCopiesPerCard?: number;
  singleton?: boolean;
  requiresCommander?: boolean;
  notes: string[];
}

export const deckRulesRegistry: DeckRulePreset[] = [
  {
    id: 'magic-standard',
    label: 'Magic Standard',
    game: 'magic',
    format: 'standard',
    minCards: 60,
    maxCopiesPerCard: 4,
    notes: ['Minimum 60 cards.', 'Maximum 4 copies per card, except basic lands.'],
  },
  {
    id: 'magic-commander',
    label: 'Magic Commander',
    game: 'magic',
    format: 'commander',
    exactCards: 100,
    singleton: true,
    requiresCommander: true,
    notes: ['Exactly 100 cards.', 'Singleton format except basic lands.', 'Commander selection is planned in this MVP.'],
  },
  {
    id: 'magic-modern',
    label: 'Magic Modern',
    game: 'magic',
    format: 'modern',
    minCards: 60,
    maxCopiesPerCard: 4,
    notes: ['Minimum 60 cards.', 'Maximum 4 copies per card, except basic lands.'],
  },
  {
    id: 'magic-pioneer',
    label: 'Magic Pioneer',
    game: 'magic',
    format: 'pioneer',
    minCards: 60,
    maxCopiesPerCard: 4,
    notes: ['Minimum 60 cards.', 'Maximum 4 copies per card, except basic lands.'],
  },
  {
    id: 'pokemon-standard',
    label: 'Pokemon TCG',
    game: 'pokemon_tcg',
    format: 'pokemon_standard',
    exactCards: 60,
    notes: ['MVP validates the 60-card deck size. Full Pokemon TCG rules are planned.'],
  },
  {
    id: 'yugioh-advanced',
    label: 'Yu-Gi-Oh Advanced',
    game: 'yugioh',
    format: 'yugioh_advanced',
    minCards: 40,
    maxCards: 60,
    notes: ['Main deck must contain 40 to 60 cards. Extra deck validation is planned.'],
  },
  {
    id: 'custom',
    label: 'Custom',
    game: 'custom',
    format: 'custom',
    notes: ['Custom deck rules are user-defined in a future editor.'],
  },
];

const basicLands = ['plains', 'island', 'swamp', 'mountain', 'forest', 'wastes'];
const isBasicLand = (name: string) => basicLands.includes(name.toLowerCase());

export function getDeckRulePreset(game: TcgGame, format: DeckFormat): DeckRulePreset {
  return deckRulesRegistry.find((rule) => rule.game === game && rule.format === format) || deckRulesRegistry[0];
}

export function validateDeck(deck: UserDeck, rulePreset: DeckRulePreset): DeckValidationResult {
  const totalCards = deck.cards.reduce((sum, card) => sum + card.quantity, 0);
  const warnings: string[] = [];
  const errors: string[] = [];

  if (rulePreset.exactCards && totalCards !== rulePreset.exactCards) {
    errors.push(`${rulePreset.label} requires exactly ${rulePreset.exactCards} cards.`);
  }
  if (rulePreset.minCards && totalCards < rulePreset.minCards) {
    warnings.push(`${rulePreset.label} usually requires at least ${rulePreset.minCards} cards.`);
  }
  if (rulePreset.maxCards && totalCards > rulePreset.maxCards) {
    errors.push(`${rulePreset.label} allows at most ${rulePreset.maxCards} cards.`);
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
    warnings.push('Commander selection is planned; mark your commander in deck notes for now.');
  }
  if (deck.cards.length === 0) {
    warnings.push('Add cards from the gallery to start validating this deck.');
  }

  return {
    valid: errors.length === 0,
    warnings,
    errors,
    totalCards,
  };
}
