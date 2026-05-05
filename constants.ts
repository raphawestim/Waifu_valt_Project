
import type { SearchOptions, SourceApi } from './types';

export const API_CONFIG = {
  gelbooru: {
    baseUrl: 'https://gelbooru.com/index.php?page=dapi&s=post&q=index&json=1',
    authParams: '&api_key=46b411b88db3d1ffc9ea401522d6a1394e7c83836b245217a80104b90d8b55d3d83c6ae08a2fec2587f7945924d90f7531a6ce65df51775e959904f995353f75&user_id=1837413', 
  },
  waifuIm: {
    baseUrl: 'https://api.waifu.im',
    apiKey: 'q1-1GbCCXNWwWu8u-XLgHpfV__s4SXskyB5LPey-v3bdj--8L7RnIxvN6n3cX19RklNgas_i5naaL_UYmIg8E3aQAzImD9LjcCdP8xJcIRewjOj68qqjoOAfMgtXnq-XIVMwSOroPxTA_6s7RdfTafGazEUD5MsJc1ZJ4CVBIoI',
  },
  rule34: {
    baseUrl: 'https://api.rule34.xxx/index.php?page=dapi&s=post&q=index&json=1',
    authParams: '&api_key=0b1c62663b571bf3cc957dab9974be29907d98697b4f197ed26629f4280aa0162ba651ca75cd1a108ab83658ab0d1782ad7a3c0e31af48e98f530018e8083ba5&user_id=5607049',
  },
  konachan: {
    baseUrl: 'https://konachan.net/post.json',
    authParams: '',
  },
  yandere: {
    baseUrl: 'https://yande.re/post.json',
    authParams: '',
  },
};

export const API_FAVICONS: Record<SourceApi, string> = {
  'waifu.im': 'https://waifu.im/favicon.ico',
  'gelbooru': 'https://gelbooru.com/favicon.ico',
  'rule34': 'https://rule34.xxx/favicon.ico',
  'konachan': 'https://konachan.net/favicon.ico',
  'yandere': 'https://yande.re/favicon.ico',
};



export const POPULAR_TAGS = ['1girl', 'solo', 'smile', 'school_uniform', 'long_hair', 'anime', 'fantasy', 'blonde_hair'];

// Valid slugs from waifu.im /tags endpoint — SFW
export const WAIFU_IM_VERSATILE_TAGS = ['waifu', 'maid', 'selfies', 'uniform', 'marin-kitagawa', 'raiden-shogun', 'mori-calliope', 'genshin-impact', 'kamisato-ayaka', 'arknights', 'black-clover'];
// Valid slugs from waifu.im /tags endpoint — NSFW
export const WAIFU_IM_NSFW_TAGS = ['ass', 'hentai', 'milf', 'oral', 'paizuri', 'ecchi', 'ero', 'oppai'];
// All valid waifu.im slugs in a Set for fast lookup
export const WAIFU_IM_VALID_SLUGS = new Set([...WAIFU_IM_VERSATILE_TAGS, ...WAIFU_IM_NSFW_TAGS]);

export const NSFW_SOURCES: SourceApi[] = ['rule34'];

export const DEFAULT_SEARCH_OPTIONS: SearchOptions = {
    query: '',
    limit: 30,
    tags: [],
    sources: [],
    contentType: 'all',
    isNsfwEnabled: false,
};
