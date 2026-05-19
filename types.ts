export interface WaifuImage {
  id: string;
  thumbnailUrl: string;
  fullUrl: string;
  tags: string[];
  score: number;
  artist?: string;
  sourceApi: 'gelbooru' | 'waifu.im' | 'rule34' | 'konachan' | 'yandere' | 'comfyui' | 'local' | 'kusowanka' | 'danbooru';
  rating: 'safe' | 'questionable' | 'explicit';
  width: number;
  height: number;
  type: 'image' | 'video' | 'gif';
  positivePrompt?: string;
  negativePrompt?: string;
}

export type RatingFilter = 'safe' | 'questionable';

export type SourceApi = 'gelbooru' | 'waifu.im' | 'rule34' | 'konachan' | 'yandere' | 'kusowanka' | 'danbooru';
export type GallerySortOption = 'newest' | 'trending' | 'most_viewed' | 'rating';

export interface SearchOptions {
  query: string;
  limit: number;
  tags: string[];
  sources: SourceApi[];
  contentType: 'all' | 'images' | 'videos' | 'gifs';
  isNsfwEnabled?: boolean;
  sortBy?: GallerySortOption;
}

export interface User {
  id?: string;
  username: string;
  token: string;
  avatar_url?: string;
  blacklistTags?: string;
}

export interface UserList {
  name: string;
  images: WaifuImage[];
}

export interface NHentaiTag {
  id: number;
  type: string;
  name: string;
  url: string;
  count: number;
}

export interface NHentaiImage {
  t: string; // type ('j', 'p', 'g')
  w: number; // width
  h: number; // height
}

export interface NHentaiGallery {
  id: number;
  media_id: string;
  // V1 API / Gallery Detail
  title?: {
    english: string;
    japanese: string;
    pretty: string;
  };
  images?: {
    pages: NHentaiImage[];
    cover: NHentaiImage;
    thumbnail: NHentaiImage;
  };
  scanlator?: string;
  upload_date?: number;
  tags?: NHentaiTag[];
  num_pages: number;
  num_favorites?: number;
  
  // V2 API List / Search Results
  english_title?: string | null;
  japanese_title?: string | null;
  thumbnail?: string | { path: string; width: number; height: number };
  thumbnail_width?: number;
  thumbnail_height?: number;
  tag_ids?: number[];
  blacklisted?: boolean;

  // V2 API Detail
  cover?: { path: string; width: number; height: number };
  pages?: { number: number; path: string; width: number; height: number; thumbnail: string; thumbnail_width: number; thumbnail_height: number }[];
}
