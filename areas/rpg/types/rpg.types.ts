export interface DndApiReference {
  index: string;
  name: string;
  url: string;
}

export interface DndApiListResponse {
  count: number;
  results: DndApiReference[];
}

export interface DndClass {
  index: string;
  name: string;
  hit_die?: number;
  proficiencies?: DndApiReference[];
  saving_throws?: DndApiReference[];
  subclasses?: DndApiReference[];
  spellcasting?: unknown;
  url: string;
}

export interface DndRace {
  index: string;
  name: string;
  speed?: number;
  ability_bonuses?: unknown[];
  alignment?: string;
  age?: string;
  size?: string;
  size_description?: string;
  languages?: DndApiReference[];
  traits?: DndApiReference[];
  url: string;
}

export interface DndSpell {
  index: string;
  name: string;
  desc?: string[];
  higher_level?: string[];
  range?: string;
  components?: string[];
  material?: string;
  ritual?: boolean;
  duration?: string;
  concentration?: boolean;
  casting_time?: string;
  level?: number;
  school?: DndApiReference;
  classes?: DndApiReference[];
  subclasses?: DndApiReference[];
  url: string;
}

export interface DndMonster {
  index: string;
  name: string;
  size?: string;
  type?: string;
  subtype?: string;
  alignment?: string;
  armor_class?: unknown[];
  hit_points?: number;
  hit_dice?: string;
  speed?: Record<string, string>;
  strength?: number;
  dexterity?: number;
  constitution?: number;
  intelligence?: number;
  wisdom?: number;
  charisma?: number;
  challenge_rating?: number;
  xp?: number;
  actions?: Array<{ name?: string; desc?: string }>;
  special_abilities?: Array<{ name?: string; desc?: string }>;
  legendary_actions?: Array<{ name?: string; desc?: string }>;
  url: string;
}

export interface DndEquipment {
  index: string;
  name: string;
  equipment_category?: DndApiReference;
  weapon_category?: string;
  armor_category?: string;
  cost?: { quantity: number; unit: string };
  weight?: number;
  damage?: { damage_dice?: string; damage_type?: DndApiReference };
  desc?: string[];
  url: string;
}

export interface DndRule {
  index: string;
  name: string;
  desc?: string;
  subsections?: DndApiReference[];
  url: string;
}

export interface DndCondition {
  index: string;
  name: string;
  desc?: string[];
  url: string;
}

export interface UserRpgCharacter {
  id: string;
  userId: string;
  name: string;
  raceIndex?: string;
  raceName?: string;
  classIndex?: string;
  className?: string;
  level: number;
  background?: string;
  alignment?: string;
  attributes: {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  };
  notes?: string;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserCampaign {
  id: string;
  userId: string;
  name: string;
  system: 'dnd5e' | 'custom';
  tone?: string;
  world?: string;
  description?: string;
  characterIds: string[];
  notes?: string;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignSession {
  id: string;
  userId: string;
  campaignId: string;
  title: string;
  summary?: string;
  notes?: string;
  sessionDate?: string;
  createdAt: string;
  updatedAt: string;
}
