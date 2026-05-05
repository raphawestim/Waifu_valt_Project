import type { Plugin } from 'vite';
import { rule34videoScraper } from './services/rule34video';

export default function r34videoPlugin(): Plugin {
    return {
        name: 'vite-plugin-r34video',
        configureServer(server) {
            server.middlewares.use(async (req, res, next) => {
                if (!req.url || !req.url.startsWith('/api/r34video/')) {
                    return next();
                }

                try {
                    const url = new URL(req.url, `http://${req.headers.host}`);
                    const path = url.pathname.replace('/api/r34video/', '');

                    res.setHeader('Content-Type', 'application/json');
                    res.setHeader('Access-Control-Allow-Origin', '*');

                    if (path === 'latest') {
                        const page = parseInt(url.searchParams.get('page') || '1', 10);
                        const data = await rule34videoScraper.getLatest(page);
                        return res.end(JSON.stringify(data));
                    }

                    if (path === 'search') {
                        const query = url.searchParams.get('query') || '';
                        const page = parseInt(url.searchParams.get('page') || '1', 10);
                        
                        if (!query) {
                            res.statusCode = 400;
                            return res.end(JSON.stringify({ error: 'Query is required' }));
                        }

                        const data = await rule34videoScraper.searchVideos(query, page);
                        return res.end(JSON.stringify(data));
                    }

                    if (path === 'details') {
                        const id = url.searchParams.get('id');
                        
                        if (!id) {
                            res.statusCode = 400;
                            return res.end(JSON.stringify({ error: 'Video ID is required' }));
                        }

                        const data = await rule34videoScraper.getVideoDetails(id);
                        return res.end(JSON.stringify(data));
                    }

                    res.statusCode = 404;
                    res.end(JSON.stringify({ error: 'Not found' }));
                } catch (error: any) {
                    console.error('[R34Video API Error]', error);
                    res.statusCode = 500;
                    res.end(JSON.stringify({ error: error.message || 'Internal server error' }));
                }
            });
        }
    };
}
