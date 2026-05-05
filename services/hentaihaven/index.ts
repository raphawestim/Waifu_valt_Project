import { fetchHtmlWithRetry } from './api';
import { parseAnimeList, parseEpisodeList } from './parser';
import { HHSearchResponse, HHEpisodeResponse } from './types';

const BASE_URL = 'https://hentaihaven.xxx';

export const hhScraper = {
    /**
     * Get latest anime from the homepage
     */
    async getLatest(page: number = 1): Promise<HHSearchResponse> {
        let url = `${BASE_URL}/?m_orderby=latest`;
        if (page > 1) {
            url = `${BASE_URL}/page/${page}/?m_orderby=latest`;
        }
        const html = await fetchHtmlWithRetry(url);
        const data = parseAnimeList(html);
        if (data.currentPage === 1 && page > 1) {
            data.currentPage = page;
        }
        return data;
    },

    /**
     * Search anime by query
     */
    async searchAnime(query: string, page: number = 1): Promise<HHSearchResponse> {
        let url = `${BASE_URL}/?s=${encodeURIComponent(query)}&post_type=wp-manga`;
        if (page > 1) {
            url = `${BASE_URL}/page/${page}/?s=${encodeURIComponent(query)}&post_type=wp-manga`;
        }
        const html = await fetchHtmlWithRetry(url);
        const data = parseAnimeList(html);
        if (data.currentPage === 1 && page > 1) {
            data.currentPage = page;
        }
        return data;
    },

    /**
     * Get anime by genre/series tag (e.g. "big-tits", "uncensored", "milf")
     */
    async getByGenre(genre: string, page: number = 1): Promise<HHSearchResponse> {
        let url = `${BASE_URL}/series/${encodeURIComponent(genre)}/`;
        if (page > 1) {
            url = `${BASE_URL}/series/${encodeURIComponent(genre)}/page/${page}/`;
        }
        const html = await fetchHtmlWithRetry(url);
        const data = parseAnimeList(html);
        if (data.currentPage === 1 && page > 1) {
            data.currentPage = page;
        }
        return data;
    },

    /**
     * Get newest episodes from the "Pick Your Poison" page
     */
    async getNewestEpisodes(): Promise<HHEpisodeResponse> {
        const url = `${BASE_URL}/pick-your-poison/`;
        const html = await fetchHtmlWithRetry(url);
        return parseEpisodeList(html);
    }
};

export * from './types';
