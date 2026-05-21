export type GameApiCategory = 'card_games' | 'tcg' | 'video_games' | 'metadata';

export interface GameApiSource {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  category: GameApiCategory;
  status: 'ready' | 'planned' | 'experimental';
  accent: 'violet' | 'cyan' | 'rose' | 'amber' | 'emerald';
  endpoint: string;
  highlights: string[];
}

