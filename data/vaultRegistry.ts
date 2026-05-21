export type VaultId = 'games' | 'tcg' | 'manga' | 'rpg' | 'forge' | 'nsfw';

export type VaultStatus = 'active' | 'beta' | 'planned';
export type VaultAccent = 'cyan' | 'violet' | 'magenta' | 'amber' | 'emerald' | 'rose';

export interface VaultRegistryItem {
  id: VaultId;
  title: string;
  subtitle: string;
  description: string;
  route: string;
  status: VaultStatus;
  accent: VaultAccent;
  requiresAuth: boolean;
  requiresNsfwAccess: boolean;
  badge?: string;
  buttonLabel: string;
}

export const vaultRegistry: VaultRegistryItem[] = [
  {
    id: 'games',
    title: 'Vault Games',
    subtitle: 'Discover / Track / Rate / Complete',
    description:
      'Discover games, track your backlog, organize favorites, wishlist titles and mark what you finished, completed or platinumed.',
    route: '/games',
    status: 'active',
    accent: 'cyan',
    requiresAuth: false,
    requiresNsfwAccess: false,
    buttonLabel: 'Enter Games Vault',
  },
  {
    id: 'tcg',
    title: 'Vault TCG',
    subtitle: 'Cards / Decks / Collections / TCG Tools',
    description: 'Explore cards, build decks, manage collections and organize TCG strategies across different games.',
    route: '/tcg',
    status: 'beta',
    accent: 'violet',
    requiresAuth: false,
    requiresNsfwAccess: false,
    buttonLabel: 'Enter TCG Vault',
  },
  {
    id: 'manga',
    title: 'Vault Manga / Anime',
    subtitle: 'Manga / Anime / Reading / Library',
    description:
      'Explore manga and anime metadata, favorite covers, manage your reading list and read chapters when the source allows it.',
    route: '/manga',
    status: 'active',
    accent: 'magenta',
    requiresAuth: false,
    requiresNsfwAccess: false,
    buttonLabel: 'Enter Manga Vault',
  },
  {
    id: 'rpg',
    title: 'Vault D&D / RPG',
    subtitle: 'Characters / Campaigns / AI Dungeon Master',
    description: 'Create characters, build campaigns, organize sessions and play RPG stories with a local AI companion.',
    route: '/rpg',
    status: 'beta',
    accent: 'amber',
    requiresAuth: false,
    requiresNsfwAccess: false,
    buttonLabel: 'Enter RPG Vault',
  },
  {
    id: 'forge',
    title: 'Vault Forge / Prompt Lab',
    subtitle: 'Prompts / ComfyUI / Ollama / AI Tools',
    description: 'Analyze images, build prompts, manage ComfyUI workflows and use local AI models for creative generation.',
    route: '/forge',
    status: 'planned',
    accent: 'emerald',
    requiresAuth: false,
    requiresNsfwAccess: false,
    buttonLabel: 'Enter Forge Vault',
  },
  {
    id: 'nsfw',
    title: 'Vault NSFW',
    subtitle: 'Adult Vault / Private Gallery / +18',
    description: 'Access the protected adult vault area.',
    route: '/nsfw',
    status: 'active',
    accent: 'rose',
    requiresAuth: true,
    requiresNsfwAccess: true,
    badge: '18+',
    buttonLabel: 'Enter Vault NSFW',
  },
];
