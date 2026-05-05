import * as cheerio from 'cheerio';
import { HHAnime, HHEpisode, HHSearchResponse, HHEpisodeResponse } from './types';

/**
 * Parse anime listing cards from the homepage or series pages.
 * Targets `.page-item-detail` containers that hold cover art, title, rating, episodes.
 */
export function parseAnimeList(html: string): HHSearchResponse {
    const $ = cheerio.load(html);
    const results: HHAnime[] = [];
    const seen = new Set<string>();

    // Each anime card lives inside .page-item-detail
    $('.page-item-detail').each((_i, el) => {
        try {
            const $el = $(el);

            // Title & URL from .post-title a
            const titleLink = $el.find('.post-title a').first();
            const title = titleLink.text().trim();
            const url = titleLink.attr('href') || '';

            if (!title || !url) return;

            // Deduplicate by URL (homepage often repeats items in multiple sliders)
            if (seen.has(url)) return;
            seen.add(url);

            // Extract ID from the data-post-id attribute on item-thumb
            const itemThumb = $el.find('.item-thumb');
            const id = itemThumb.attr('data-post-id') || url.split('/watch/')[1]?.replace(/\/$/, '') || '';

            // Cover image: uses lazy loading with data-src
            const img = itemThumb.find('img');
            const coverImage = img.attr('data-src') || img.attr('src') || '';

            // Rating: count filled star icons
            const fullStars = $el.find('.ratings_stars.rating_current').length;
            const halfStars = $el.find('.ratings_stars.rating_current_half').length;
            const rating = fullStars + (halfStars * 0.5);

            // Episodes
            const episodes: HHEpisode[] = [];
            $el.find('.chapter-item').each((_j, chEl) => {
                const $ch = $(chEl);
                const epLink = $ch.find('a.btn-link');
                const epTitle = epLink.text().trim();
                const epUrl = epLink.attr('href') || '';
                if (epTitle && epUrl) {
                    episodes.push({ title: epTitle, url: epUrl, thumbnail: '' });
                }
            });

            results.push({ id, title, url, coverImage, rating, episodes });
        } catch (err) {
            // Skip malformed entries
        }
    });

    // Try to detect pagination
    let currentPage = 1;
    let totalPages = 1;

    // The pagination uses .wp-pagenavi or similar
    const activePage = $('.wp-pagenavi .current').text().trim();
    if (activePage) {
        currentPage = parseInt(activePage, 10) || 1;
    }
    const lastPage = $('.wp-pagenavi a.last, .wp-pagenavi a.page.larger').last().text().trim();
    if (lastPage) {
        totalPages = parseInt(lastPage, 10) || currentPage;
    }
    // Fallback: if there's a "next" link, assume at least one more page
    if (totalPages <= currentPage && $('.wp-pagenavi a.nextpostslink').length > 0) {
        totalPages = currentPage + 1;
    }

    return { results, currentPage, totalPages: Math.max(totalPages, 1) };
}

/**
 * Parse episode listings from the "Pick Your Poison" page.
 * Targets `.episode_item` containers.
 */
export function parseEpisodeList(html: string): HHEpisodeResponse {
    const $ = cheerio.load(html);
    const results: HHEpisode[] = [];

    $('.episode_item').each((_i, el) => {
        try {
            const $el = $(el);

            const link = $el.find('.thumbnail a');
            const url = link.attr('href') || '';
            const title = link.attr('title') || $el.find('.data a').text().trim() || '';
            const img = $el.find('.thumbnail img');
            const thumbnail = img.attr('src') || img.attr('data-src') || '';

            if (title && url) {
                results.push({ title, url, thumbnail });
            }
        } catch (err) {
            // Skip
        }
    });

    return { results, currentPage: 1, totalPages: 1 };
}
