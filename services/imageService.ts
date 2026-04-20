
import { API_CONFIG } from '../constants';
import type { WaifuImage, SearchOptions, SourceApi } from '../types';

// Switched to corsproxy.io as it is often more reliable for these specific image boards than allorigins
const CORS_PROXY = 'https://corsproxy.io/?';

const fetchWithTimeout = async <T,>(url: string, options: RequestInit = {}, timeout = 60000): Promise<T> => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
        ...options,
        signal: controller.signal
    });
    clearTimeout(id);

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const text = await response.text();
    try {
        // Handle cases where API returns an empty string for no results
        if (text === '') return [] as T;
        return JSON.parse(text);
    } catch (e) {
        console.warn("Failed to parse JSON, returning empty array.", text);
        return [] as T;
    }
};

const VIDEO_EXTENSIONS = ['mp4', 'webm'];
const GIF_EXTENSIONS = ['gif'];

const getFileType = (url: string): 'image' | 'video' | 'gif' => {
    if (!url) return 'image';
    // Remove query parameters before checking extension
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

const normalizeDanbooruPost = (post: any): WaifuImage => ({
    id: `danbooru-${post.id}`,
    thumbnailUrl: `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(post.preview_file_url)}`,
    fullUrl: `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(post.large_file_url || post.file_url)}`,
    tags: post.tag_string?.split(' ') || [],
    score: post.score,
    artist: post.tag_string_artist?.replace(/ /g, '_') || 'unknown',
    sourceApi: 'danbooru',
    rating: post.rating === 's' ? 'safe' : post.rating === 'q' ? 'questionable' : 'explicit',
    width: post.image_width,
    height: post.image_height,
    type: getFileType(post.large_file_url || post.file_url),
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

const fetchGelbooru = async (query: string, limit: number, page: number) => {
    const { baseUrl, authParams } = API_CONFIG.gelbooru;
    const targetUrl = `${baseUrl}&tags=${encodeURIComponent(query)}&limit=${limit}&pid=${page - 1}${authParams || ''}`;
    
    // Use codetabs for Gelbooru as corsproxy.io often gets 401 blocked
    const proxyUrl = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`;
    try {
        const data = await fetchWithTimeout<{ post?: any[] }>(proxyUrl);
        return data.post?.filter((p: any) => p.file_url && p.preview_url).map(normalizeGelbooruPost) || [];
    } catch (error) {
        console.error('Gelbooru API fetch failed:', error);
        return [];
    }
};

const fetchWaifuIm = async (tags: string[], limit: number, contentType: 'all' | 'images' | 'gifs', isNsfw?: boolean) => {
    const { baseUrl } = API_CONFIG.waifuIm;
    
    const params = new URLSearchParams();
    if (tags.length > 0) {
        tags.forEach(tag => params.append('IncludedTags', tag));
    }

    params.append('many', 'true');
    params.append('pageSize', String(limit));
    
    if (isNsfw !== undefined) {
      params.append('isNsfw', String(isNsfw));
    }

    if (contentType === 'images') {
        params.append('gif', 'false');
    } else if (contentType === 'gifs') {
        params.append('gif', 'true');
    }

    // Pass the API token if the user has it properly configured (but for search it's often optional)
    const targetUrl = `${baseUrl}/images?${params.toString()}`;
    
    try {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), 30000);
        
        const response = await fetch(targetUrl, { signal: controller.signal });
        clearTimeout(id);

        if (response.status === 400 || response.status === 404) {
            return [];
        }
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data.items?.map(normalizeWaifuImPost) || [];
    } catch (error) {
        console.error('Waifu.im API fetch failed:', error);
        return [];
    }
};

const fetchRule34 = async (query: string, limit: number, page: number) => {
    const { baseUrl, authParams } = API_CONFIG.rule34;
    const targetUrl = `${baseUrl}&tags=${encodeURIComponent(query)}&limit=${limit}&pid=${page - 1}${authParams || ''}`;
    
    const proxyUrl = `${CORS_PROXY}${encodeURIComponent(targetUrl)}`;
    try {
        const data = await fetchWithTimeout<any[]>(proxyUrl);
        if (!data || !Array.isArray(data)) {
          return [];
        }
        return data.filter((p: any) => p.file_url && p.preview_url).map(normalizeRule34Post);
    } catch (error) {
        console.error('Rule34.xxx API fetch failed:', error);
        return [];
    }
};

const fetchDanbooru = async (query: string, limit: number, page: number) => {
    const { baseUrl, authParams } = API_CONFIG.danbooru;
    const targetUrl = `${baseUrl}?tags=${encodeURIComponent(query)}&limit=${limit}&page=${page}${authParams || ''}`;
    const proxyUrl = `${CORS_PROXY}${encodeURIComponent(targetUrl)}`;
    
    try {
        const data = await fetchWithTimeout<any[]>(proxyUrl);
        if (!data || !Array.isArray(data)) {
          return [];
        }
        // Ensure both large/file_url and preview_file_url exist to avoid broken images
        return data.filter(p => (p.large_file_url || p.file_url) && p.preview_file_url).map(normalizeDanbooruPost);
    } catch (error) {
        console.error('Danbooru API fetch failed:', error);
        return [];
    }
};

const fetchKonachan = async (query: string, limit: number, page: number) => {
    const { baseUrl } = API_CONFIG.konachan;
    const targetUrl = `${baseUrl}?tags=${encodeURIComponent(query)}&limit=${limit}&page=${page}`;
    const proxyUrl = `${CORS_PROXY}${encodeURIComponent(targetUrl)}`;
    try {
        const data = await fetchWithTimeout<any[]>(proxyUrl);
        if (!data || !Array.isArray(data)) return [];
        return data.filter(p => p.file_url && p.preview_url).map(p => normalizeMoebooruPost(p, 'konachan'));
    } catch (error) {
        console.error('Konachan API fetch failed:', error);
        return [];
    }
};

const fetchYandere = async (query: string, limit: number, page: number) => {
    const { baseUrl } = API_CONFIG.yandere;
    const targetUrl = `${baseUrl}?tags=${encodeURIComponent(query)}&limit=${limit}&page=${page}`;
    const proxyUrl = `${CORS_PROXY}${encodeURIComponent(targetUrl)}`;
    try {
        const data = await fetchWithTimeout<any[]>(proxyUrl);
        if (!data || !Array.isArray(data)) return [];
        return data.filter(p => p.file_url && p.preview_url).map(p => normalizeMoebooruPost(p, 'yandere'));
    } catch (error) {
        console.error('Yande.re API fetch failed:', error);
        return [];
    }
};


const deduplicateImages = (images: WaifuImage[]): WaifuImage[] => {
    const seen = new Set<string>();
    return images.filter(image => {
        if (seen.has(image.fullUrl)) {
            return false;
        } else {
            seen.add(image.fullUrl);
            return true;
        }
    });
};

export const searchImages = async (options: SearchOptions, page: number): Promise<WaifuImage[]> => {
    const { query, limit, tags: selectedTags, sources: selectedSources, contentType, isNsfwEnabled } = options;

    const promises: Promise<WaifuImage[]>[] = [];
    
    const allAvailableSources: SourceApi[] = ['waifu.im', 'gelbooru', 'danbooru', 'rule34', 'konachan', 'yandere'];
    const activeSources = selectedSources.length > 0 ? selectedSources : allAvailableSources;

    // Gelbooru, Rule34 & Danbooru query
    let booruQuery = [query, ...selectedTags].filter(Boolean).join(' ');
    if (contentType === 'videos') booruQuery += ' video';
    else if (contentType === 'gifs') booruQuery += ' gif';
    else if (contentType === 'images') booruQuery += ' -video -gif';
    
    // Explicit exclusions if NSFW is disabled globally across standard boorus
    if (!isNsfwEnabled) {
        booruQuery += ' -rating:explicit -rating:questionable';
    }

    if (activeSources.includes('gelbooru')) {
        promises.push(fetchGelbooru(booruQuery, limit, page));
    }
    if (activeSources.includes('rule34')) {
        promises.push(fetchRule34(booruQuery, limit, page));
    }
    if (activeSources.includes('danbooru')) {
        promises.push(fetchDanbooru(booruQuery, limit, page));
    }
     if (activeSources.includes('konachan')) {
        promises.push(fetchKonachan(booruQuery, limit, page));
    }
    if (activeSources.includes('yandere')) {
        promises.push(fetchYandere(booruQuery, limit, page));
    }

    // Waifu.im query
    if (activeSources.includes('waifu.im')) {
        const waifuImTags = [query, ...selectedTags].map(t => t.trim()).filter(Boolean);
        if (contentType !== 'videos') { // Waifu.im does not support video search
            const waifuContentType = contentType as 'all' | 'images' | 'gifs';
            // Passing `isNsfwEnabled` to explicitly tell api.waifu.im we allow NSFW content
            promises.push(fetchWaifuIm(waifuImTags.length > 0 ? waifuImTags : ['waifu'], limit, waifuContentType, isNsfwEnabled));
        }
    }
    
    if (promises.length === 0) {
        return [];
    }

    const results = await Promise.all(promises);
    const flattened = results.flat();
    return deduplicateImages(flattened).slice(0, limit);
};

export const getRandomImages = async (limit: number, options: SearchOptions): Promise<WaifuImage[]> => {
    const promises: Promise<WaifuImage[]>[] = [];
    
    const allAvailableSources: SourceApi[] = ['waifu.im', 'gelbooru', 'danbooru', 'rule34', 'konachan', 'yandere'];
    const activeSources = options.sources.length > 0 ? options.sources : allAvailableSources;
    
    const ratingFilter = options.isNsfwEnabled ? '' : ' -rating:explicit -rating:questionable';
    const konachanFilter = options.isNsfwEnabled ? '' : ' rating:safe';

    if (activeSources.includes('gelbooru')) {
        promises.push(fetchGelbooru(`sort:id:desc${ratingFilter}`, limit, 1));
    }
    if (activeSources.includes('rule34')) {
        promises.push(fetchRule34(`sort:id:desc${ratingFilter}`, limit, 1));
    }
    if (activeSources.includes('danbooru')) {
        promises.push(fetchDanbooru(`order:id_desc${konachanFilter}`, limit, 1));
    }
     if (activeSources.includes('konachan')) {
        promises.push(fetchKonachan(`order:id_desc${konachanFilter}`, limit, 1));
    }
    if (activeSources.includes('yandere')) {
        promises.push(fetchYandere(`order:id_desc${konachanFilter}`, limit, 1));
    }
    if (activeSources.includes('waifu.im')) {
        promises.push(fetchWaifuIm(['waifu'], limit, 'all', options.isNsfwEnabled));
    }
    
    if (promises.length === 0) return [];

    const results = await Promise.all(promises);
    const flattened = results.flat();
    
    const shuffled = flattened.sort(() => 0.5 - Math.random());
    return deduplicateImages(shuffled).slice(0, limit);
};
