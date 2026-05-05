import type { Plugin } from 'vite';
import https from 'https';
import http from 'http';

export function nhentaiPlugin(apiKey?: string): Plugin {
    return {
        name: 'nhentai-api-proxy',
        configureServer(server) {
            server.middlewares.use((req, res, next) => {
                const url = req.url || '';

                // ── API: NHentai Proxy ──
                if (url.startsWith('/api/nhentai/')) {
                    const key = apiKey || process.env.NHENTAI_API_KEY;
                    if (!key || key === 'your_nhentai_api_key_here') {
                        res.statusCode = 500;
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify({ error: 'NHENTAI_API_KEY is not configured in .env.local' }));
                        return;
                    }

                    // Extract the path after /api/nhentai/
                    const targetPath = url.replace('/api/nhentai/', '');
                    const targetUrl = `https://nhentai.net/api/v2/${targetPath}`;

                    const proxyReq = https.get(targetUrl, {
                        headers: {
                            'User-Agent': 'WaifuVault/1.0 (personal use)',
                            'Authorization': `Key ${key}`,
                            'Accept': 'application/json',
                        },
                        timeout: 30000,
                    }, (proxyRes) => {
                        res.statusCode = proxyRes.statusCode || 200;
                        if (proxyRes.headers['content-type']) {
                            res.setHeader('Content-Type', proxyRes.headers['content-type']);
                        }
                        res.setHeader('Access-Control-Allow-Origin', '*');
                        
                        let body = '';
                        proxyRes.on('data', (chunk) => {
                            res.write(chunk);
                            body += chunk;
                        });
                        proxyRes.on('end', () => {
                            res.end();
                        });
                    });

                    proxyReq.on('error', (err: any) => {
                        console.error('NHentai Proxy error:', err.message);
                        res.statusCode = 502;
                        res.end(JSON.stringify({ error: 'Proxy fetch failed', detail: String(err) }));
                    });

                    proxyReq.on('timeout', () => {
                        proxyReq.destroy();
                        res.statusCode = 504;
                        res.end(JSON.stringify({ error: 'Proxy timeout' }));
                    });

                    return;
                }

                next();
            });
        },
    };
}
