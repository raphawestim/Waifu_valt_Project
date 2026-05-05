import { fetchHtmlWithRetry } from './api';
import { parseVideoList, parseVideoDetails } from './parser';
import { R34VideoResponse, R34VideoDetails } from './types';

const BASE_URL = 'https://rule34video.com';

export const rule34videoScraper = {
    /**
     * Get the latest / newest videos (no search query required)
     */
    async getLatest(page: number = 1): Promise<R34VideoResponse> {
        let url = `${BASE_URL}/latest-updates/`;
        if (page > 1) {
            url += `?from=${page}`;
        }
        const html = await fetchHtmlWithRetry(url);
        return parseVideoList(html);
    },

    /**
     * Search for videos by query
     */
    async searchVideos(query: string, page: number = 1): Promise<R34VideoResponse> {
        let url = `${BASE_URL}/search/${encodeURIComponent(query)}/`;
        if (page > 1) {
            url += `?from_videos=${page}`;
        }
        const html = await fetchHtmlWithRetry(url);
        return parseVideoList(html);
    },

    /**
     * Get details and direct MP4 links for a video
     */
    async getVideoDetails(videoId: string): Promise<R34VideoDetails> {
        const url = `${BASE_URL}/video/${videoId}/default-slug/`;
        const html = await fetchHtmlWithRetry(url);
        return parseVideoDetails(html, videoId);
    }
};

export * from './types';
