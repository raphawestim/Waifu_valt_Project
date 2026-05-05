import { getRandomUserAgent, delay, getRandomDelay } from './utils';

const MAX_RETRIES = 3;

export async function fetchHtmlWithRetry(url: string, retries = 0): Promise<string> {
    try {
        // Respectful delay before fetching
        if (retries === 0) await delay(getRandomDelay(2000, 5000));

        const response = await fetch(url, {
            headers: {
                'User-Agent': getRandomUserAgent(),
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
            }
        });

        if (!response.ok) {
            if (response.status === 429 || response.status === 403) {
                throw new Error(`Rate limited or forbidden: ${response.status}`);
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.text();
    } catch (error) {
        if (retries < MAX_RETRIES) {
            const backoffDelay = Math.pow(2, retries) * 3000 + getRandomDelay(1000, 3000);
            console.warn(`[Rule34Video] Fetch failed for ${url}. Retrying in ${Math.round(backoffDelay/1000)}s... (${retries + 1}/${MAX_RETRIES})`);
            await delay(backoffDelay);
            return fetchHtmlWithRetry(url, retries + 1);
        }
        throw error;
    }
}
