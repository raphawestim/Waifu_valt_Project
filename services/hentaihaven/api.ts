const WORKING_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

function getRandomUA(): string {
    return WORKING_UA;
}

function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function fetchHtml(url: string): Promise<string> {
    const response = await fetch(url, {
        headers: {
            'User-Agent': getRandomUA(),
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Referer': 'https://hentaihaven.xxx/',
        },
    });

    if (!response.ok) {
        throw new Error(`HH fetch failed: ${response.status} ${response.statusText} for ${url}`);
    }

    return await response.text();
}

export async function fetchHtmlWithRetry(url: string, maxRetries = 3): Promise<string> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            // Random delay between 500-1500ms to be polite
            if (attempt > 0) {
                await delay(1000 + Math.random() * 2000);
            } else {
                await delay(300 + Math.random() * 700);
            }
            return await fetchHtml(url);
        } catch (err: any) {
            lastError = err;
            console.warn(`[HH] Attempt ${attempt + 1}/${maxRetries} failed for ${url}: ${err.message}`);
            // Exponential backoff
            await delay(Math.pow(2, attempt) * 1000);
        }
    }

    throw lastError || new Error(`Failed to fetch ${url} after ${maxRetries} retries`);
}
