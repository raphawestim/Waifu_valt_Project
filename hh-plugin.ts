import type { Plugin } from 'vite';
import { hhScraper } from './services/hentaihaven';

export default function hhPlugin(): Plugin {
    return {
        name: 'vite-plugin-hentaihaven',
        configureServer(server) {
            server.middlewares.use(async (req, res, next) => {
                if (!req.url || !req.url.startsWith('/api/hh/')) {
                    return next();
                }

                try {
                    const url = new URL(req.url, `http://${req.headers.host}`);
                    const path = url.pathname.replace('/api/hh/', '');

                    res.setHeader('Content-Type', 'application/json');
                    res.setHeader('Access-Control-Allow-Origin', '*');

                    if (path === 'latest') {
                        const page = parseInt(url.searchParams.get('page') || '1', 10);
                        const data = await hhScraper.getLatest(page);
                        return res.end(JSON.stringify(data));
                    }

                    if (path === 'search') {
                        const query = url.searchParams.get('query') || '';
                        const page = parseInt(url.searchParams.get('page') || '1', 10);
                        
                        if (!query) {
                            res.statusCode = 400;
                            return res.end(JSON.stringify({ error: 'Query is required' }));
                        }

                        const data = await hhScraper.searchAnime(query, page);
                        return res.end(JSON.stringify(data));
                    }

                    if (path === 'genre') {
                        const genre = url.searchParams.get('genre') || '';
                        const page = parseInt(url.searchParams.get('page') || '1', 10);
                        
                        if (!genre) {
                            res.statusCode = 400;
                            return res.end(JSON.stringify({ error: 'Genre is required' }));
                        }

                        const data = await hhScraper.getByGenre(genre, page);
                        return res.end(JSON.stringify(data));
                    }

                    if (path === 'episodes') {
                        const data = await hhScraper.getNewestEpisodes();
                        return res.end(JSON.stringify(data));
                    }

                    res.statusCode = 404;
                    res.end(JSON.stringify({ error: 'Not found' }));
                } catch (error: any) {
                    console.error('[HH API Error]', error);
                    res.statusCode = 500;
                    res.end(JSON.stringify({ error: error.message || 'Internal server error' }));
                }
            });
        }
    };
}
