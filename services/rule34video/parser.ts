import * as cheerio from 'cheerio';
import { R34VideoSearchResult, R34VideoDetails, R34VideoResponse } from './types';

const BASE_URL = 'https://rule34video.com';

const normalizeRule34VideoUrl = (url: string): string => {
    if (!url) return '';
    if (url.startsWith('//')) return `https:${url}`;
    if (url.startsWith('/')) return `${BASE_URL}${url}`;
    return url;
};

export function parseVideoList(html: string): R34VideoResponse {
    const $ = cheerio.load(html);
    const results: R34VideoSearchResult[] = [];

    $('.item.thumb').each((_, el) => {
        const title = $(el).find('.thumb_title').text().trim();
        const aTag = $(el).find('a.th.js-open-popup');
        const url = normalizeRule34VideoUrl(aTag.attr('href') || '');
        
        let id = '';
        const idMatch = url.match(/\/video\/(\d+)\//);
        if (idMatch) id = idMatch[1];

        const imgTag = $(el).find('img.thumb');
        const thumbnail = normalizeRule34VideoUrl(
            imgTag.attr('data-original') ||
            imgTag.attr('data-src') ||
            imgTag.attr('data-webp') ||
            imgTag.attr('src') ||
            ''
        );
        
        const duration = $(el).find('.time').text().trim();
        const viewsStr = $(el).find('.views').text().trim();
        const ratingStr = $(el).find('.rating').text().trim();

        if (id && title) {
            results.push({
                id,
                title,
                url,
                thumbnail,
                duration,
                views: viewsStr,
                rating: ratingStr
            });
        }
    });

    let currentPage = 1;
    let totalPages = 1;

    const pagination = $('.pagination');
    if (pagination.length > 0) {
        const active = pagination.find('.active span').text().trim();
        if (active) currentPage = parseInt(active, 10);
        
        const lastLink = pagination.find('a').last().attr('href');
        if (lastLink) {
            const pageMatch = lastLink.match(/[?&]page=(\d+)/) || lastLink.match(/\/(\d+)\/?$/);
            if (pageMatch) {
                totalPages = parseInt(pageMatch[1], 10);
            }
        }
    }

    // Default to at least the current page if no last link found but items exist
    if (results.length > 0 && totalPages < currentPage) {
        totalPages = currentPage;
    }

    return {
        results,
        currentPage,
        totalPages
    };
}

export function parseVideoDetails(html: string, videoId: string): R34VideoDetails {
    const $ = cheerio.load(html);
    
    const title = $('h1.title_video').text().trim() || $('title').text().replace('- Rule 34 Video', '').trim();
    
    const tags: { id: string; name: string; url: string }[] = [];
    $('.info .item').each((_, el) => {
        const label = $(el).find('.title').text().trim().toLowerCase();
        if (label.includes('tags') || label.includes('categories')) {
            $(el).find('a').each((_, a) => {
                const name = $(a).text().trim();
                const url = $(a).attr('href') || '';
                let id = name.replace(/\s+/g, '-').toLowerCase();
                tags.push({ id, name, url });
            });
        }
    });

    let description = '';
    
    // Extract mp4 direct url from JS flashvars
    let mp4Url = '';
    const videoUrlMatch = html.match(/video_url:\s*'([^']+)'/);
    if (videoUrlMatch && videoUrlMatch[1]) {
        mp4Url = videoUrlMatch[1];
        // Note: Rule34video sometimes requires valid token attached, which is already in the flashvars url.
    } else {
        // Fallback for some old players
        const sourceTag = $('source[type="video/mp4"]');
        if (sourceTag.length > 0) {
            mp4Url = sourceTag.attr('src') || '';
        }
    }

    // If there is highest quality, try to find video_alt_url4, 3, 2 etc.
    const urlMatches = html.matchAll(/video_alt_url\d*:\s*'([^']+)'/g);
    for (const match of urlMatches) {
        // Just take the last one which usually is the highest quality or first one
        // For simplicity we assign mp4Url to the highest available we iterate over.
        // Actually, the main video_url is usually 360p, alt_urls are higher.
        if (match[1]) {
            mp4Url = match[1];
        }
    }

    return {
        id: videoId,
        title,
        url: `https://rule34video.com/video/${videoId}/`,
        thumbnail: '', // Needs to be fetched or passed if needed, or extract from flashvars
        duration: '',
        views: '',
        rating: '',
        uploadDate: '',
        description,
        tags,
        mp4Url
    };
}
