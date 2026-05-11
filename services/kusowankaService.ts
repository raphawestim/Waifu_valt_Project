// ============================================================
// Kusowanka.com — Frontend Service
// Interface para consumir os endpoints do backend proxy
// ============================================================

import type {
    KusowankaSearchResponse,
    KusowankaPostDetails,
    KusowankaPostSources,
    KusowankaSortOrder,
} from './kusowanka/types';

const API_BASE = '/api/kusowanka';

/**
 * Serviço frontend para consumir os endpoints do scraper Kusowanka.
 * Faz chamadas ao backend proxy (Vite plugin) que executa o scraping.
 * 
 * @example
 * ```tsx
 * import { kusowankaService } from './services/kusowankaService';
 * 
 * // Buscar posts
 * const results = await kusowankaService.search('1girl solo', 1, 40);
 * 
 * // Detalhes de um post
 * const details = await kusowankaService.getPost('8000000');
 * 
 * // URLs das imagens
 * const sources = await kusowankaService.getSources('8000000');
 * ```
 */
export const kusowankaService = {

    /**
     * Busca posts por tags.
     */
    async search(
        query: string,
        page: number = 1,
        limit: number = 40,
        sort?: KusowankaSortOrder,
    ): Promise<KusowankaSearchResponse> {
        const params = new URLSearchParams({
            q: query,
            page: String(page),
            limit: String(limit),
        });
        if (sort) params.set('sort', sort);

        const res = await fetch(`${API_BASE}/search?${params.toString()}`);
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || `Kusowanka API error: ${res.status}`);
        }
        return await res.json();
    },

    /**
     * Obtém detalhes completos de um post.
     */
    async getPost(id: string | number): Promise<KusowankaPostDetails> {
        const res = await fetch(`${API_BASE}/post?id=${id}`);
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || `Kusowanka API error: ${res.status}`);
        }
        return await res.json();
    },

    /**
     * Obtém URLs das imagens em diferentes resoluções.
     */
    async getSources(id: string | number): Promise<KusowankaPostSources> {
        const res = await fetch(`${API_BASE}/sources?id=${id}`);
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || `Kusowanka API error: ${res.status}`);
        }
        return await res.json();
    },

    /**
     * Obtém posts populares.
     */
    async getPopular(page: number = 1): Promise<KusowankaSearchResponse> {
        const res = await fetch(`${API_BASE}/popular?page=${page}`);
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || `Kusowanka API error: ${res.status}`);
        }
        return await res.json();
    },

    /**
     * Obtém posts mais recentes.
     */
    async getLatest(page: number = 1): Promise<KusowankaSearchResponse> {
        const res = await fetch(`${API_BASE}/latest?page=${page}`);
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || `Kusowanka API error: ${res.status}`);
        }
        return await res.json();
    },

    /**
     * Obtém posts com melhor avaliação.
     */
    async getTopRated(page: number = 1): Promise<KusowankaSearchResponse> {
        const res = await fetch(`${API_BASE}/top-rated?page=${page}`);
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || `Kusowanka API error: ${res.status}`);
        }
        return await res.json();
    },
};
