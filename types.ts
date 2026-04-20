export interface WaifuImage {
  id: string;
  thumbnailUrl: string;
  fullUrl: string;
  tags: string[];
  score: number;
  artist?: string;
  sourceApi: 'gelbooru' | 'waifu.im' | 'rule34' | 'danbooru' | 'konachan' | 'yandere' | 'local';
  rating: 'safe' | 'questionable' | 'explicit';
  width: number;
  height: number;
  type: 'image' | 'video' | 'gif';
}

export type RatingFilter = 'safe' | 'questionable';

export type SourceApi = 'gelbooru' | 'waifu.im' | 'rule34' | 'danbooru' | 'konachan' | 'yandere';

export interface SearchOptions {
  query: string;
  limit: number;
  tags: string[];
  sources: SourceApi[];
  contentType: 'all' | 'images' | 'videos' | 'gifs';
  isNsfwEnabled?: boolean;
}

export interface User {
  username: string;
  token: string;
}

export interface UserList {
  name: string;
  images: WaifuImage[];
}