import type { NHentaiGallery, NHentaiImage } from '../types';

const API_BASE = '/api/nhentai';

function ext(t: string): string {
    switch (t) {
        case 'p': return 'png';
        case 'g': return 'gif';
        case 'w': return 'webp';
        default: return 'jpg';
    }
}

export const nhentaiService = {
    async searchGalleries(query: string, page: number = 1): Promise<{ result: NHentaiGallery[], num_pages: number }> {
        // According to API v2 docs: /search?query=...&page=...
        const res = await fetch(`${API_BASE}/search?query=${encodeURIComponent(query)}&page=${page}`);
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || `NHentai API error: ${res.status}`);
        }
        return await res.json();
    },

    async getPopularNow(): Promise<{ result: NHentaiGallery[] }> {
        // Popular is often an empty search sorted by popular, or a specific endpoint. 
        // We will just do a blank search sorted by popular.
        const res = await fetch(`${API_BASE}/search?query=${encodeURIComponent('""')}&sort=popular`);
        if (!res.ok) throw new Error(`NHentai API error: ${res.status}`);
        return await res.json();
    },
    
    async getNewUploads(page: number = 1): Promise<{ result: NHentaiGallery[], num_pages: number }> {
        const res = await fetch(`${API_BASE}/galleries?page=${page}`);
        if (!res.ok) throw new Error(`NHentai API error: ${res.status}`);
        return await res.json();
    },

    async getGallery(id: number): Promise<NHentaiGallery> {
        const res = await fetch(`${API_BASE}/galleries/${id}`);
        if (!res.ok) throw new Error(`NHentai API error: ${res.status}`);
        return await res.json();
    },

    getCoverUrl(gallery: NHentaiGallery): string {
        let url = '';
        if (gallery.thumbnail) {
            url = `https://t.nhentai.net/${gallery.thumbnail}`;
        } else if (gallery.images && gallery.images.cover) {
            url = `https://t.nhentai.net/galleries/${gallery.media_id}/cover.${ext(gallery.images.cover.t)}`;
        } else {
            url = `https://t.nhentai.net/galleries/${gallery.media_id}/thumb.jpg`; // Fallback
        }
        return `/api/proxy-image?url=${encodeURIComponent(url)}`;
    },

    getPageUrl(gallery: NHentaiGallery, pageNum: number): string {
        let url = '';
        if (gallery.pages) {
            const page = gallery.pages[pageNum - 1];
            if (!page) return '';
            url = `https://i.nhentai.net/${page.path}`;
        } else if (gallery.images && gallery.images.pages) {
            const img = gallery.images.pages[pageNum - 1];
            if (!img) return '';
            url = `https://i.nhentai.net/galleries/${gallery.media_id}/${pageNum}.${ext(img.t)}`;
        } else {
            return '';
        }
        return `/api/proxy-image?url=${encodeURIComponent(url)}`;
    },

    getPageThumbnailUrl(gallery: NHentaiGallery, pageNum: number): string {
        let url = '';
        if (gallery.pages) {
            const page = gallery.pages[pageNum - 1];
            if (!page) return '';
            url = `https://t.nhentai.net/${page.thumbnail}`;
        } else if (gallery.images && gallery.images.pages) {
            const img = gallery.images.pages[pageNum - 1];
            if (!img) return '';
            url = `https://t.nhentai.net/galleries/${gallery.media_id}/${pageNum}t.${ext(img.t)}`;
        } else {
            return '';
        }
        return `/api/proxy-image?url=${encodeURIComponent(url)}`;
    }
};
