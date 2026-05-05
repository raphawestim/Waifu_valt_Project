import { HHSearchResponse, HHEpisodeResponse } from './hentaihaven/types';

export const hhService = {
    async getLatest(page: number = 1): Promise<HHSearchResponse> {
        const response = await fetch(`/api/hh/latest?page=${page}`);
        if (!response.ok) throw new Error('Failed to fetch latest anime');
        return response.json();
    },

    async searchAnime(query: string, page: number = 1): Promise<HHSearchResponse> {
        const response = await fetch(`/api/hh/search?query=${encodeURIComponent(query)}&page=${page}`);
        if (!response.ok) throw new Error('Failed to search anime');
        return response.json();
    },

    async getByGenre(genre: string, page: number = 1): Promise<HHSearchResponse> {
        const response = await fetch(`/api/hh/genre?genre=${encodeURIComponent(genre)}&page=${page}`);
        if (!response.ok) throw new Error('Failed to fetch anime by genre');
        return response.json();
    },

    async getNewestEpisodes(): Promise<HHEpisodeResponse> {
        const response = await fetch('/api/hh/episodes');
        if (!response.ok) throw new Error('Failed to fetch newest episodes');
        return response.json();
    }
};
