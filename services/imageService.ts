
import { API_CONFIG, WAIFU_IM_VALID_SLUGS } from '../constants';
import type { WaifuImage, SearchOptions, SourceApi } from '../types';
import { kusowankaService } from './kusowankaService';

// External CORS proxies only used for API JSON fetching (not images)
const API_PROXIES = [
    'https://api.codetabs.com/v1/proxy?quest=',
    'https://corsproxy.io/?'
];

const getRandomApiProxy = () => API_PROXIES[Math.floor(Math.random() * API_PROXIES.length)];

const fetchWithTimeout = async <T,>(url: string, options: RequestInit = {}, timeout = 60000): Promise<T> => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    const proxy = getRandomApiProxy();
    const finalUrl = `${proxy}${encodeURIComponent(url)}`;

    try {
        const response = await fetch(finalUrl, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(id);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data as T;
    } catch (e) {
        // Retry once with a different proxy if it fails
        const secondProxy = API_PROXIES[(API_PROXIES.indexOf(proxy) + 1) % API_PROXIES.length];
        try {
            const secondResponse = await fetch(`${secondProxy}${encodeURIComponent(url)}`, { ...options, signal: controller.signal });
            if (secondResponse.ok) return await secondResponse.json();
        } catch (e2) {}
        
        console.error(`Fetch failed for ${url}:`, e);
        return [] as any as T;
    }
};

const VIDEO_EXTENSIONS = ['mp4', 'webm'];
const GIF_EXTENSIONS = ['gif'];

const getFileType = (url: string): 'image' | 'video' | 'gif' => {
    if (!url) return 'image';
    const cleanUrl = url.split('?')[0];
    const extension = cleanUrl.split('.').pop()?.toLowerCase();
    if (extension && VIDEO_EXTENSIONS.includes(extension)) return 'video';
    if (extension && GIF_EXTENSIONS.includes(extension)) return 'gif';
    return 'image';
};

const normalizeGelbooruPost = (post: any): WaifuImage => ({
    id: `gelbooru-${post.id}`,
    thumbnailUrl: post.preview_url,
    fullUrl: post.file_url,
    tags: post.tags.split(' '),
    score: post.score,
    artist: post.owner?.replace(/ /g, '_') || 'unknown',
    sourceApi: 'gelbooru',
    rating: post.rating,
    width: post.width,
    height: post.height,
    type: getFileType(post.file_url),
});

const normalizeWaifuImPost = (post: any): WaifuImage => ({
    id: `waifuim-${post.id ?? post.image_id}`,
    thumbnailUrl: post.url,
    fullUrl: post.url,
    tags: post.tags?.map((t: any) => t.name) || [],
    score: post.favorites ?? post.favourites ?? 0,
    artist: post.artists?.[0]?.name || post.artist?.name || post.source?.split('/').slice(-2, -1)[0] || 'unknown',
    sourceApi: 'waifu.im',
    rating: post.isNsfw || post.is_nsfw ? 'questionable' : 'safe',
    width: post.width,
    height: post.height,
    type: getFileType(post.url),
});

const normalizeRule34Post = (post: any): WaifuImage => ({
    id: `rule34-${post.id}`,
    thumbnailUrl: post.preview_url,
    fullUrl: post.file_url,
    tags: post.tags.split(' '),
    score: post.score,
    artist: post.owner?.replace(/ /g, '_') || 'unknown',
    sourceApi: 'rule34',
    rating: post.rating,
    width: post.width,
    height: post.height,
    type: getFileType(post.file_url),
});


const normalizeMoebooruPost = (post: any, sourceApi: 'konachan' | 'yandere'): WaifuImage => ({
    id: `${sourceApi}-${post.id}`,
    thumbnailUrl: post.preview_url,
    fullUrl: post.file_url,
    tags: post.tags.split(' '),
    score: post.score,
    artist: post.author?.replace(/ /g, '_') || 'unknown',
    sourceApi: sourceApi,
    rating: post.rating === 's' ? 'safe' : post.rating === 'q' ? 'questionable' : 'explicit',
    width: post.width,
    height: post.height,
    type: getFileType(post.file_url),
});

const normalizeDanbooruPost = (post: any): WaifuImage => {
    const fullUrl = post.file_url || post.large_file_url || post.preview_file_url;
    // Danbooru can have thumbnails in media_asset or directly in preview_file_url
    const thumb = post.media_asset?.variants?.find((v: any) => v.type === '360x360')?.url || 
                  post.preview_file_url || 
                  post.large_file_url || 
                  fullUrl;
    
    return {
        id: `danbooru-${post.id}`,
        thumbnailUrl: thumb,
        fullUrl: fullUrl,
        tags: (post.tag_string || '').split(' '),
        score: post.score,
        artist: post.tag_string_artist || 'unknown',
        sourceApi: 'danbooru',
        rating: post.rating === 's' ? 'safe' : post.rating === 'q' ? 'questionable' : 'explicit',
        width: post.image_width,
        height: post.image_height,
        type: getFileType(fullUrl),
    };
};

const fetchGelbooru = async (query: string, limit: number, page: number) => {
    const { baseUrl, authParams } = API_CONFIG.gelbooru;
    const targetUrl = `${baseUrl}&tags=${encodeURIComponent(query)}&limit=${limit}&pid=${page - 1}${authParams || ''}`;
    try {
        const data = await fetchWithTimeout<{ post?: any[] }>(targetUrl);
        return data.post?.filter((p: any) => p.file_url && p.preview_url).map(normalizeGelbooruPost) || [];
    } catch (error) {
        console.error('Gelbooru API fetch failed:', error);
        return [];
    }
};

const fetchWaifuIm = async (tags: string[], limit: number, contentType: 'all' | 'images' | 'gifs', isNsfw?: boolean) => {
    const { baseUrl, apiKey } = API_CONFIG.waifuIm;
    const params = new URLSearchParams();

    // Only send tags that are valid waifu.im slugs; ignore generic booru tags
    const validTags = tags.filter(t => t && WAIFU_IM_VALID_SLUGS.has(t.toLowerCase()));
    if (validTags.length > 0) {
        validTags.forEach(tag => params.append('IncludedTags', tag.toLowerCase()));
    }
    // If no valid tag was found, default to 'waifu' so we always get results
    else {
        params.append('IncludedTags', 'waifu');
    }

    params.append('many', 'true');
    params.append('pageSize', String(limit));
    // Correct casing: IsNsfw (capital I)
    if (isNsfw === true) params.append('IsNsfw', 'True');
    else if (isNsfw === false) params.append('IsNsfw', 'False');
    // undefined → omit (API defaults to SFW)
    if (contentType === 'images') params.append('gif', 'false');
    else if (contentType === 'gifs') params.append('gif', 'true');

    const targetUrl = `${baseUrl}/images?${params.toString()}`;
    try {
        const headers: Record<string, string> = { 'Accept': 'application/json' };
        if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;
        const response = await fetch(targetUrl, { headers });
        if (!response.ok) return [];
        const data = await response.json();
        return data.items?.map(normalizeWaifuImPost) || [];
    } catch (error) {
        return [];
    }
};

const fetchRule34 = async (query: string, limit: number, page: number) => {
    const { baseUrl, authParams } = API_CONFIG.rule34;
    const targetUrl = `${baseUrl}&tags=${encodeURIComponent(query)}&limit=${limit}&pid=${page - 1}${authParams || ''}`;
    try {
        const data = await fetchWithTimeout<any[]>(targetUrl);
        if (!data || !Array.isArray(data)) return [];
        return data.filter((p: any) => p.file_url && p.preview_url).map(normalizeRule34Post);
    } catch (error) {
        return [];
    }
};



const fetchKonachan = async (query: string, limit: number, page: number) => {
    const { baseUrl } = API_CONFIG.konachan;
    const targetUrl = `${baseUrl}?tags=${encodeURIComponent(query)}&limit=${limit}&page=${page}`;
    try {
        const data = await fetchWithTimeout<any[]>(targetUrl);
        if (!data || !Array.isArray(data)) return [];
        return data.filter(p => p.file_url && p.preview_url).map(p => normalizeMoebooruPost(p, 'konachan'));
    } catch (error) {
        return [];
    }
};

const fetchYandere = async (query: string, limit: number, page: number) => {
    const { baseUrl } = API_CONFIG.yandere;
    const targetUrl = `${baseUrl}?tags=${encodeURIComponent(query)}&limit=${limit}&page=${page}`;
    try {
        const data = await fetchWithTimeout<any[]>(targetUrl);
        if (!data || !Array.isArray(data)) return [];
        return data.filter(p => p.file_url && p.preview_url).map(p => normalizeMoebooruPost(p, 'yandere'));
    } catch (error) {
        return [];
    }
};

const fetchDanbooru = async (query: string, limit: number, page: number) => {
    const { baseUrl, authParams } = API_CONFIG.danbooru;
    const targetUrl = `${baseUrl}?tags=${encodeURIComponent(query)}&limit=${limit}&page=${page}${authParams || ''}`;
    try {
        const data = await fetchWithTimeout<any[]>(targetUrl);
        if (!data || !Array.isArray(data)) return [];
        return data.filter((p: any) => p.file_url).map(normalizeDanbooruPost);
    } catch (error) {
        return [];
    }
};


const deduplicateImages = (images: WaifuImage[]): WaifuImage[] => {
    const seen = new Set<string>();
    return images.filter(image => {
        if (seen.has(image.fullUrl)) return false;
        seen.add(image.fullUrl);
        return true;
    });
};

export const searchImages = async (options: SearchOptions, page: number): Promise<WaifuImage[]> => {
    const { query, limit, tags: selectedTags, sources: selectedSources, contentType, isNsfwEnabled } = options;
    const promises: Promise<WaifuImage[]>[] = [];
    const allAvailableSources: SourceApi[] = ['waifu.im', 'gelbooru', 'rule34', 'konachan', 'yandere', 'danbooru'];
    let activeSources = selectedSources.length > 0 ? selectedSources : allAvailableSources;

    let booruQuery = [query, ...selectedTags].filter(Boolean).join(' ');
    if (contentType === 'videos') booruQuery += ' video';
    else if (contentType === 'gifs') booruQuery += ' gif';
    else if (contentType === 'images') booruQuery += ' -video -gif';
    
    if (!isNsfwEnabled) booruQuery += ' -rating:explicit -rating:questionable';

    if (activeSources.includes('gelbooru')) promises.push(fetchGelbooru(booruQuery, limit, page));
    if (activeSources.includes('rule34')) promises.push(fetchRule34(booruQuery, limit, page));
    if (activeSources.includes('konachan')) promises.push(fetchKonachan(booruQuery, limit, page));
    if (activeSources.includes('yandere')) promises.push(fetchYandere(booruQuery, limit, page));
    if (activeSources.includes('danbooru')) promises.push(fetchDanbooru(booruQuery, limit, page));
    // For waifu.im, filter to valid slugs from both query and tags
    if (activeSources.includes('waifu.im')) {
        const waifuTags = [query, ...selectedTags].filter(t => t && WAIFU_IM_VALID_SLUGS.has(t.toLowerCase()));
        promises.push(fetchWaifuIm(waifuTags, limit, contentType as any, isNsfwEnabled));
    }
    
    const results = await Promise.all(promises);
    return deduplicateImages(results.flat()).slice(0, limit);
};

export const getRandomImages = async (limit: number, options: SearchOptions): Promise<WaifuImage[]> => {
    const promises: Promise<WaifuImage[]>[] = [];
    const allAvailableSources: SourceApi[] = ['waifu.im', 'gelbooru', 'rule34', 'konachan', 'yandere', 'danbooru', 'kusowanka'];
    let activeSources = options.sources.length > 0 ? options.sources : allAvailableSources;

    // Force strict safe mode: only waifu.im allowed when NSFW is off
    if (!options.isNsfwEnabled) {
        activeSources = ['waifu.im'];
    }
    const ratingFilter = options.isNsfwEnabled ? '' : ' -rating:explicit -rating:questionable';
    const konachanFilter = options.isNsfwEnabled ? '' : ' rating:safe';

    if (activeSources.includes('gelbooru')) promises.push(fetchGelbooru(`sort:id:desc${ratingFilter}`, limit, 1));
    if (activeSources.includes('rule34')) promises.push(fetchRule34(`sort:id:desc${ratingFilter}`, limit, 1));
    if (activeSources.includes('konachan')) promises.push(fetchKonachan(`order:id_desc${konachanFilter}`, limit, 1));
    if (activeSources.includes('yandere')) promises.push(fetchYandere(`order:id_desc${konachanFilter}`, limit, 1));
    if (activeSources.includes('danbooru')) promises.push(fetchDanbooru(`order:random${konachanFilter}`, limit, 1));

    if (activeSources.includes('waifu.im')) promises.push(fetchWaifuIm(['waifu'], limit, 'all', options.isNsfwEnabled));
    
    const results = await Promise.all(promises);
    return deduplicateImages(results.flat().sort(() => 0.5 - Math.random())).slice(0, limit);
};

// Gelbooru tag type mapping: 0=general, 1=artist, 3=copyright, 4=character, 5=metadata
const GELBOORU_CATEGORY_MAP: Record<string, number> = { artist: 1, character: 4, metadata: 5 };

// Comprehensive fallback tags per category for every letter
const EXPLORER_FALLBACKS: Record<string, Record<string, string[]>> = {
    artist: {
        '#': ['40hara', '7th_dragon', '00s'],
        a: ['artoria_pendragon_(fate)', 'asanagi', 'aka_ringo', 'akemi_homura', 'as109', 'ao_no_machi', 'arlmuffin', 'arknights', 'ayase_eli'],
        b: ['bkub', 'blizzard_(company)', 'blazblue', 'bangs', 'blue_archive', 'boa_(brianoa)', 'butcha-u'],
        c: ['cirenk', 'clamp', 'card_captor_sakura', 'cube85', 'cutesexyrobutts', 'carnelian'],
        d: ['drew', 'doomfest', 'doskoinpo', 'dantewontdie', 'dandon_fuga', 'daidai_(daidai826)'],
        e: ['efe', 'erect_sawaru', 'exlic', 'elf_(company)', 'eiwa', 'endou_masatoshi'],
        f: ['fishine', 'fuzichoco', 'fumio_(rsqkr)', 'final_fantasy', 'fate_(series)'],
        g: ['ganaha_hibiki', 'goto_p', 'gaou_(mamo)', 'genshin_impact', 'grimgrim'],
        h: ['hews', 'hirame', 'hiten_(hitenkei)', 'houtengeki', 'honjou_raita', 'hews_hack'],
        i: ['ikkitousen', 'imaizumi_kagerou', 'inui_toko', 'ishikei', 'ikomochi'],
        j: ['jlullaby', 'john_doe', 'jcm2', 'jonsun', 'jackson_pollock'],
        k: ['kantoku', 'kloah', 'kurehito_misaki', 'krenz_cushart', 'kawakami_rokkaku', 'kieta', 'koyorin'],
        l: ['lack', 'lm_(legoman)', 'lunacle', 'lee_hyeseung', 'lpip', 'lolicept'],
        m: ['mika_pikazo', 'murata_range', 'mignon', 'mochizuki_kei', 'momoko_(momopoco)', 'mushimaro'],
        n: ['namori', 'norasuko', 'nardack', 'naruwe', 'nishieda', 'novelance'],
        o: ['ooyari_ashito', 'oda_non', 'oyari_ashito', 'okama', 'onineko', 'oouso'],
        p: ['pochi_(pochi-goya)', 'palow', 'pako', 'piromizu', 'potg', 'petenshi_(dr._vermilion)'],
        q: ['queen_bee', 'quasarcake', 'qblade'],
        r: ['raita', 'raichiyo33', 'rustle', 'robutts', 'rak_(kuraga)', 'rin_sin'],
        s: ['sakimichan', 'saitom', 'sky-freedom', 'shirabi', 'shion_(mirudakemann)', 'sciamano240', 'shunya_yamashita'],
        t: ['tony_taka', 'tsuaii', 'takunomi', 'takeda_hiromitsu', 'tiv', 'tsubasa_tsubasa'],
        u: ['udon_(company)', 'unya', 'urata_asao', 'unrealbe', 'uzura_no_tamago'],
        v: ['vofan', 'voice_actor_connection', 'viperxtr', 'v-mag', 'vivit_gray'],
        w: ['wada_arco', 'wlop', 'waero', 'wang_yi_(dynasty_warriors)', 'wokada'],
        x: ['xianglong', 'xration', 'xiaoman_tu', 'xephyr'],
        y: ['yomu_(sgt_epper)', 'yom', 'yuugen', 'yamada_naoko_(hideko1227)', 'yogisya', 'yuzusoft'],
        z: ['zettai_ryouiki', 'zanka', 'z-ton', 'zankuro', 'zero_two_(darling_in_the_franxx)'],
    },
    character: {
        '#': ['2b_(nier_automata)', '9s_(nier_automata)', '00s'],
        a: ['asuka_langley_soryu', 'ahri', 'aqua_(konosuba)', 'albedo_(overlord)', 'artoria_pendragon_(fate)', 'asuna_(sao)', 'ai_hoshino_(oshi_no_ko)', 'anya_forger'],
        b: ['bulma', 'bowsette', 'byleth_(fire_emblem)', 'beidou_(genshin_impact)', 'bronya_zaychik', 'blanc_(neptunia)'],
        c: ['chika_fujiwara', 'c.c._(code_geass)', 'cynthia_(pokemon)', 'camilla_(fire_emblem)', 'chitanda_eru', 'coconut_(nekopara)'],
        d: ['darkness_(konosuba)', 'diego_brando', 'dawn_(pokemon)', 'diona_(genshin_impact)', 'dva_(overwatch)'],
        e: ['emilia_(re:zero)', 'ereshkigal_(fate)', 'eula_(genshin_impact)', 'erza_scarlet', 'echidna_(re:zero)'],
        f: ['fischl_(genshin_impact)', 'fubuki_(one_punch_man)', 'formidable_(azur_lane)', 'frieren'],
        g: ['ganyu_(genshin_impact)', 'gojo_satoru', 'goblin_slayer', 'gilgamesh_(fate)'],
        h: ['hatsune_miku', 'hu_tao_(genshin_impact)', 'hinata_hyuuga', 'homura_akemi', 'hikari_(xenoblade_2)'],
        i: ['ino_yamanaka', 'illya_(fate)', 'ishtar_(fate)', 'iori_rinko'],
        j: ['jeanne_d_arc_(fate)', 'jolyne_cujoh', 'jotaro_kujo', 'jinx_(league_of_legends)'],
        k: ['kafka_(honkai_star_rail)', 'keqing_(genshin_impact)', 'kaguya_shinomiya', 'kirby', 'klee_(genshin_impact)', 'komi_shouko'],
        l: ['lumine_(genshin_impact)', 'lucina_(fire_emblem)', 'lum_(urusei_yatsura)', 'lisa_(genshin_impact)'],
        m: ['megumin', 'makima_(chainsaw_man)', 'mona_(genshin_impact)', 'mikasa_ackerman', 'mordred_(fate)', 'miku_nakano'],
        n: ['nami_(one_piece)', 'naruto_uzumaki', 'nier_automata', 'nahida_(genshin_impact)', 'noelle_(genshin_impact)'],
        o: ['ochako_uraraka', 'onigiri', 'original', 'oshinoko', 'okayu_(hololive)'],
        p: ['power_(chainsaw_man)', 'pyra_(xenoblade)', 'prinz_eugen_(azur_lane)', 'paimon_(genshin_impact)'],
        q: ['quetzalcoatl_(fate)', 'quintessential_quintuplets'],
        r: ['rem_(re:zero)', 'raiden_shogun', 'robin_(fire_emblem)', 'roxy_migurdia', 'ranni_the_witch'],
        s: ['saber_(fate)', 'sakura_haruno', 'shenhe_(genshin_impact)', 'shuten_douji_(fate)', 'silver_fox'],
        t: ['tifa_lockhart', 'tamamo_(fate)', 'tatsumaki_(one_punch_man)', 'tohsaka_rin', 'toga_himiko'],
        u: ['uzumaki_naruto', 'uzaki_hana', 'uraraka_ochako', 'unicorn_(azur_lane)'],
        v: ['vegeta', 'venti_(genshin_impact)', 'violet_evergarden', 'vladilena_milize'],
        w: ['wiz_(konosuba)', 'wei_wuxian', 'white_heart_(neptunia)'],
        x: ['xiao_(genshin_impact)', 'xenoblade_(series)', 'xiangling_(genshin_impact)'],
        y: ['yae_miko_(genshin_impact)', 'yoshino_(date_a_live)', 'yukinoshita_yukino', 'yamato_(one_piece)'],
        z: ['zero_two_(darling_in_the_franxx)', 'zelda_(princess)', 'zhongli_(genshin_impact)', 'zenitsu_agatsuma'],
    },
    metadata: {
        '#': ['1girl', '2girls', '1boy', '3girls', '1other'],
        a: ['absurdres', 'ass', 'alternate_costume', 'animal_ears', 'artist_name', 'aqua_eyes', 'armor'],
        b: ['black_hair', 'blonde_hair', 'blue_eyes', 'blue_hair', 'breasts', 'bow', 'blush', 'brown_hair'],
        c: ['commentary', 'commentary_request', 'cleavage', 'closed_eyes', 'chibi', 'colored_pencil_(medium)'],
        d: ['dress', 'duplicate', 'dark_skin', 'detached_sleeves', 'drill_hair'],
        e: ['english_text', 'eyebrows_visible_through_hair', 'elbow_gloves'],
        f: ['full_body', 'fang', 'flower', 'food', 'from_behind', 'facing_viewer'],
        g: ['gloves', 'green_eyes', 'green_hair', 'glasses', 'grey_hair', 'grin'],
        h: ['highres', 'hair_ornament', 'hat', 'hair_ribbon', 'horns', 'holding'],
        i: ['incredibly_absurdres', 'instrument', 'ice_cream'],
        j: ['japanese_clothes', 'jewelry', 'japanese_text'],
        k: ['kimono', 'knee_boots', 'knife', 'kneehighs'],
        l: ['long_hair', 'looking_at_viewer', 'large_breasts', 'loli'],
        m: ['multiple_girls', 'medium_breasts', 'multicolored_hair', 'maid'],
        n: ['navel', 'no_humans', 'nude', 'necktie', 'night'],
        o: ['open_mouth', 'original', 'one_eye_closed', 'outdoors'],
        p: ['pink_hair', 'ponytail', 'purple_eyes', 'purple_hair', 'parted_lips'],
        q: ['queen', 'questionable'],
        r: ['red_eyes', 'ribbon', 'red_hair', 'rain'],
        s: ['solo', 'smile', 'school_uniform', 'short_hair', 'simple_background', 'skirt', 'sitting', 'swimsuit'],
        t: ['thighhighs', 'translation_request', 'translated', 'tail', 'twintails', 'twitter_username'],
        u: ['underwear', 'uniform', 'upper_body'],
        v: ['very_long_hair', 'virtual_youtuber', 'vest'],
        w: ['white_hair', 'weapon', 'white_background', 'wings', 'witch_hat'],
        x: ['x_hair_ornament'],
        y: ['yellow_eyes', 'yuri', 'year_of_the'],
        z: ['zettai_ryouiki', 'zoom_layer'],
    }
};

export const fetchExplorerTags = async (type: 'artists' | 'characters' | 'metadata' | 'artist' | 'character', letter: string): Promise<string[]> => {
    const normType = type === 'artists' ? 'artist' : type === 'characters' ? 'character' : type;
    
    // Danbooru categories: 0=General, 1=Artist, 3=Copyright, 4=Character, 5=Meta
    const danbooruCatMap: Record<string, number> = {
        'artist': 1,
        'character': 4,
        'metadata': 0
    };
    const categoryId = danbooruCatMap[normType] ?? 0;
    
    // Danbooru uses * for wildcard search
    const letterPattern = letter === '#' ? '*' : `${letter.toLowerCase()}*`;

    // 1) Danbooru tag API (Extremely accurate and high quality tags)
    try {
        const { authParams } = API_CONFIG.danbooru;
        const danbooruUrl = `https://danbooru.donmai.us/tags.json?search[name_matches]=${encodeURIComponent(letterPattern)}&search[category]=${categoryId}&search[order]=count&limit=60${authParams || ''}`;
        
        const data = await fetchWithTimeout<any[]>(danbooruUrl);
        if (Array.isArray(data) && data.length > 0) {
            const tags = data.filter(t => t.post_count > 10).map(t => t.name);
            if (tags.length > 0) return tags;
        }
    } catch (e) { console.warn('Danbooru tag fetch failed:', e); }

    // 2) Comprehensive hardcoded fallback
    const letterKey = letter === '#' ? '#' : letter.toLowerCase();
    return EXPLORER_FALLBACKS[normType]?.[letterKey] || [];
};

export const getTagPreview = async (tag: string): Promise<string | null> => {
    // 1) Danbooru (Highest quality previews)
    try {
        const { baseUrl, authParams } = API_CONFIG.danbooru;
        const danbooruUrl = `${baseUrl}?tags=${encodeURIComponent(tag)}&limit=1${authParams || ''}`;
        const data = await fetchWithTimeout<any[]>(danbooruUrl);
        if (data && data.length > 0) {
            const url = data[0].media_asset?.variants?.find((v: any) => v.type === '360x360')?.url || data[0].preview_file_url || data[0].file_url || null;
            return url ? `/api/proxy-image?url=${encodeURIComponent(url)}` : null;
        }
    } catch (e) {}

    // 2) Gelbooru
    try {
        const gelbooruAuth = API_CONFIG.gelbooru.authParams;
        const gelbooruUrl = `https://gelbooru.com/index.php?page=dapi&s=post&q=index&json=1&tags=${encodeURIComponent(tag)}&limit=1${gelbooruAuth}`;
        const data = await fetchWithTimeout<any>(gelbooruUrl);
        if (data?.post?.length > 0) {
            return data.post[0].preview_url || data.post[0].file_url || null;
        }
    } catch (e) {}

    // 2) Yandere direct fallback (supports CORS natively)
    try {
        const yandereUrl = `https://yande.re/post.json?tags=${encodeURIComponent(tag)}&limit=1`;
        const resp = await fetch(yandereUrl);
        if (resp.ok) {
            const posts = await resp.json();
            if (Array.isArray(posts) && posts.length > 0) {
                return posts[0].preview_url || posts[0].file_url || null;
            }
        }
    } catch (e) {}

    return null;
};
