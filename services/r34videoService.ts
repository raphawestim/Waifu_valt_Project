import { R34VideoResponse, R34VideoDetails } from './rule34video/types';

export const r34videoService = {
    async getLatestVideos(page: number = 1): Promise<R34VideoResponse> {
        const res = await fetch(`/api/r34video/latest?page=${page}`);
        if (!res.ok) throw new Error(`R34Video API error: ${res.status}`);
        return await res.json();
    },

    async searchVideos(query: string, page: number = 1): Promise<R34VideoResponse> {
        const res = await fetch(`/api/r34video/search?query=${encodeURIComponent(query)}&page=${page}`);
        if (!res.ok) throw new Error(`R34Video API error: ${res.status}`);
        return await res.json();
    },

    async getVideoDetails(id: string): Promise<R34VideoDetails> {
        const res = await fetch(`/api/r34video/details?id=${encodeURIComponent(id)}`);
        if (!res.ok) throw new Error(`R34Video API error: ${res.status}`);
        return await res.json();
    }
};
