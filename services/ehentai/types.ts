export type EHentaiSource = 'e-hentai' | 'exhentai';

export type EHentaiCategory =
  | 'Doujinshi'
  | 'Manga'
  | 'Artist CG'
  | 'Game CG'
  | 'Western'
  | 'Image Set'
  | 'Non-H'
  | 'Cosplay'
  | 'Asian Porn'
  | 'Misc'
  | 'Private'
  | string;

export type EHentaiGidToken = readonly [number, string];

export interface EHentaiClientOptions {
  source?: EHentaiSource;
  useExHentai?: boolean;
  cookies?: string;
  namespace?: 0 | 1;
  maxRetries?: number;
  baseDelayMs?: number;
  requestCooldownMs?: number;
  requestsBeforeCooldown?: number;
  proxyEndpoint?: string;
}

export interface EHentaiReaderOptions extends EHentaiClientOptions {
  maxGalleryPages?: number;
  resolveImageUrls?: boolean;
  maxImagePagesToResolve?: number;
}

export interface EHentaiApiRequest {
  method: 'gdata';
  gidlist: EHentaiGidToken[];
  namespace?: 0 | 1;
}

export interface EHentaiApiErrorEntry {
  gid: number;
  error: string;
}

export interface EHentaiApiGallery {
  gid: number | string;
  token: string;
  archiver_key?: string;
  title: string;
  title_jpn?: string;
  category: EHentaiCategory;
  thumb?: string;
  uploader?: string;
  posted: string;
  filecount: string;
  filesize: number;
  expunged: boolean;
  rating: string;
  torrentcount?: string;
  tags: string[];
  parent_gid?: string;
  parent_key?: string;
  current_gid?: string;
  current_key?: string;
  first_gid?: string;
  first_key?: string;
}

export interface EHentaiApiResponse {
  gmetadata?: Array<EHentaiApiGallery | EHentaiApiErrorEntry>;
  error?: string;
}

export interface EHentaiTagGroup {
  namespace: string;
  tags: string[];
}

export interface EHentaiNormalizedGallery {
  id: string;
  gid: number;
  token: string;
  sourceApi: EHentaiSource;
  url: string;
  title: string;
  titleJpn: string | null;
  category: EHentaiCategory;
  thumbnailUrl: string | null;
  uploader: string | null;
  posted: number;
  postedAt: string;
  fileCount: number;
  fileSizeBytes: number;
  fileSizeLabel: string;
  expunged: boolean;
  rating: number;
  torrentCount: number;
  tags: string[];
  tagGroups: EHentaiTagGroup[];
  parent?: { gid: number; token: string } | null;
  current?: { gid: number; token: string } | null;
  first?: { gid: number; token: string } | null;
  raw: EHentaiApiGallery;
}

export interface EHentaiGalleryError {
  gid: number;
  token?: string;
  error: string;
  removed: boolean;
}

export interface EHentaiBatchResult {
  galleries: EHentaiNormalizedGallery[];
  errors: EHentaiGalleryError[];
}

export interface ParsedEHentaiGalleryUrl {
  galleryId: number;
  galleryToken: string;
  source: EHentaiSource;
}

export interface EHentaiGalleryPagePreview {
  index: number;
  pageNumber: number;
  pageUrl: string;
  pageToken: string | null;
  galleryId: number;
  thumbnailUrl: string | null;
  thumbnailWidth?: number;
  thumbnailHeight?: number;
  imageUrl?: string | null;
  imageWidth?: number;
  imageHeight?: number;
  originalImageUrl?: string | null;
  error?: string | null;
}

export interface EHentaiParsedGallery {
  galleryId: number;
  galleryToken: string;
  source: EHentaiSource;
  galleryUrl: string;
  title: string;
  titleJpn: string | null;
  pageCount: number;
  galleryPageCount: number;
  pages: EHentaiGalleryPagePreview[];
}

export interface EHentaiResolvedImagePage {
  pageUrl: string;
  imageUrl: string | null;
  originalImageUrl: string | null;
  width?: number;
  height?: number;
  nextPageUrl?: string | null;
  error?: string | null;
}
