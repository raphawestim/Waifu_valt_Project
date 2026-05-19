import type { Plugin } from 'vite';
import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { exec } from 'child_process';

const COMFYUI_OUTPUT_DIR = path.normalize('C:/Users/Raphael/Documents/ComfyUI/ComfyUI/output');
const COMFYUI_BAT_PATH = 'C:\\Users\\Raphael\\Documents\\ComfyUI\\run_nvidia_gpu.bat';
const COMFYUI_HOST = '127.0.0.1';
const COMFYUI_PORT = 8188;


function isSafe(target: string, base: string): boolean {
    const normalTarget = path.normalize(target);
    const normalBase = path.normalize(base);
    // Ensure the target is inside the base (with trailing sep to prevent prefix tricks)
    return normalTarget.startsWith(normalBase + path.sep) || normalTarget === normalBase;
}

const JSON_PROXY_ALLOWED_HOSTS = new Set([
    'api.rule34.xxx',
    'danbooru.donmai.us',
    'gelbooru.com',
    'konachan.net',
    'yande.re',
]);

function fetchJsonThroughNode(targetUrl: string, timeout = 15000): Promise<{ statusCode: number; body: string }> {
    return new Promise((resolve, reject) => {
        const parsedUrl = new URL(targetUrl);
        const httpModule = parsedUrl.protocol === 'https:' ? https : http;
        const request = httpModule.get(parsedUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/json,text/plain,*/*',
                'Accept-Language': 'en-US,en;q=0.9',
            },
            timeout,
        }, response => {
            let body = '';
            response.setEncoding('utf8');
            response.on('data', chunk => {
                body += chunk;
            });
            response.on('end', () => {
                resolve({ statusCode: response.statusCode || 500, body });
            });
        });

        request.on('error', reject);
        request.on('timeout', () => {
            request.destroy(new Error('Proxy JSON timeout'));
        });
    });
}

function readJsonBody<T>(req: any): Promise<T> {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', (chunk: Buffer) => {
            body += chunk.toString('utf8');
        });
        req.on('end', () => {
            try {
                resolve(body ? JSON.parse(body) as T : {} as T);
            } catch (error) {
                reject(error);
            }
        });
        req.on('error', reject);
    });
}

function sendJson(res: any, statusCode: number, payload: unknown): void {
    res.statusCode = statusCode;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.end(JSON.stringify(payload));
}

async function proxyOllamaJson(baseUrl: string, pathName: string, body?: unknown): Promise<{ status: number; data: unknown }> {
    const target = `${baseUrl.replace(/\/$/, '')}${pathName}`;
    const response = await fetch(target, body === undefined ? undefined : {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    const text = await response.text();
    let data: unknown = {};
    try {
        data = text ? JSON.parse(text) : {};
    } catch {
        data = { response: text };
    }
    return { status: response.status, data };
}

function getMediaProxyHeaders(mediaUrl: string, range?: string): Record<string, string> {
    const parsedUrl = new URL(mediaUrl);
    let referer = `${parsedUrl.origin}/`;

    if (parsedUrl.hostname.includes('gelbooru.com')) referer = 'https://gelbooru.com/';
    else if (parsedUrl.hostname.includes('rule34.xxx')) referer = 'https://rule34.xxx/';
    else if (parsedUrl.hostname.includes('danbooru.donmai.us')) referer = 'https://danbooru.donmai.us/';
    else if (parsedUrl.hostname.includes('konachan')) referer = 'https://konachan.net/';
    else if (parsedUrl.hostname.includes('yande.re')) referer = 'https://yande.re/';

    const headers: Record<string, string> = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,video/*,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': referer,
    };

    if (range) {
        headers['Range'] = range;
    }

    return headers;
}

/**
 * Extracts metadata from a PNG file.
 * Specifically looks for ComfyUI 'prompt' chunk.
 */
function extractComfyMetadata(filePath: string): { positivePrompt?: string; negativePrompt?: string } {
    try {
        const buffer = fs.readFileSync(filePath);
        // PNG Signature check
        if (buffer[0] !== 0x89 || buffer[1] !== 0x50 || buffer[2] !== 0x4e || buffer[3] !== 0x47) {
            return {};
        }

        let offset = 8;
        while (offset < buffer.length) {
            const length = buffer.readInt32BE(offset);
            const type = buffer.slice(offset + 4, offset + 8).toString();
            
            if (type === 'tEXt') {
                const chunkData = buffer.slice(offset + 8, offset + 8 + length);
                const nullIdx = chunkData.indexOf(0);
                if (nullIdx !== -1) {
                    const keyword = chunkData.slice(0, nullIdx).toString();
                    if (keyword === 'prompt') {
                        const content = chunkData.slice(nullIdx + 1).toString();
                        const prompt = JSON.parse(content);
                        return parseComfyPrompt(prompt);
                    }
                }
            } else if (type === 'IEND') {
                break;
            }
            
            offset += length + 12; // length (4) + type (4) + data (length) + crc (4)
        }
    } catch (err) {
        console.error('Error parsing PNG metadata:', err);
    }
    return {};
}

function parseComfyPrompt(prompt: any): { positivePrompt?: string; negativePrompt?: string } {
    let positive = '';
    let negative = '';

    // Heuristic: Look for CLIPTextEncode nodes
    const nodes = Object.entries(prompt);
    const textNodes = nodes.filter(([_, node]: [any, any]) => node.class_type === 'CLIPTextEncode');

    if (textNodes.length >= 1) {
        positive = (textNodes[0][1] as any).inputs?.text || '';
    }
    if (textNodes.length >= 2) {
        negative = (textNodes[1][1] as any).inputs?.text || '';
    }

    // Advanced search: check KSAmpler connections if available
    const samplerNode = nodes.find(([_, node]: [any, any]) => node.class_type === 'KSampler' || node.class_type === 'KSamplerAdvanced');
    if (samplerNode) {
        const inputs = (samplerNode[1] as any).inputs;
        if (inputs.positive && Array.isArray(inputs.positive)) {
            const posId = inputs.positive[0];
            if (prompt[posId] && prompt[posId].inputs?.text) {
                positive = prompt[posId].inputs.text;
            }
        }
        if (inputs.negative && Array.isArray(inputs.negative)) {
            const negId = inputs.negative[0];
            if (prompt[negId] && prompt[negId].inputs?.text) {
                negative = prompt[negId].inputs.text;
            }
        }
    }

    return { 
        positivePrompt: positive.trim(), 
        negativePrompt: negative.trim() 
    };
}

export function comfyuiPlugin(): Plugin {
    return {
        name: 'comfyui-local-server',
        configureServer(server) {
            server.middlewares.use((req, res, next) => {
                const url = req.url || '';

                if (req.method === 'OPTIONS') {
                    res.setHeader('Access-Control-Allow-Origin', '*');
                    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
                    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
                    res.end();
                    return;
                }

                if (url.startsWith('/api/ollama/health')) {
                    const parsed = new URL(url, 'http://localhost');
                    const baseUrl = parsed.searchParams.get('baseUrl') || 'http://localhost:11434';
                    proxyOllamaJson(baseUrl, '/api/tags')
                        .then(result => sendJson(res, result.status < 500 ? 200 : 502, { online: result.status < 500 }))
                        .catch(error => sendJson(res, 502, { online: false, error: `Ollama is not reachable: ${String(error)}` }));
                    return;
                }

                if (url.startsWith('/api/ollama/models')) {
                    const parsed = new URL(url, 'http://localhost');
                    const baseUrl = parsed.searchParams.get('baseUrl') || 'http://localhost:11434';
                    proxyOllamaJson(baseUrl, '/api/tags')
                        .then(result => sendJson(res, result.status, result.data))
                        .catch(error => sendJson(res, 502, { models: [], error: `Ollama is not reachable: ${String(error)}` }));
                    return;
                }

                if (url === '/api/ollama/analyze-image' && req.method === 'POST') {
                    readJsonBody<Record<string, unknown>>(req)
                        .then(body => {
                            const baseUrl = String(body.baseUrl || 'http://localhost:11434');
                            const requestBody = { ...body };
                            delete requestBody.baseUrl;
                            return proxyOllamaJson(baseUrl, '/api/generate', {
                                ...requestBody,
                                stream: false,
                            });
                        })
                        .then(result => sendJson(res, result.status, result.data))
                        .catch(error => sendJson(res, 502, { error: `Ollama request failed: ${String(error)}` }));
                    return;
                }

                if (url === '/api/ollama/chat' && req.method === 'POST') {
                    readJsonBody<Record<string, unknown>>(req)
                        .then(body => {
                            const baseUrl = String(body.baseUrl || 'http://localhost:11434');
                            const requestBody = { ...body };
                            delete requestBody.baseUrl;
                            return proxyOllamaJson(baseUrl, '/api/chat', {
                                ...requestBody,
                                stream: false,
                            });
                        })
                        .then(result => sendJson(res, result.status, result.data))
                        .catch(error => sendJson(res, 502, { error: `Ollama chat failed: ${String(error)}` }));
                    return;
                }

                if (url === '/api/ollama/unload' && req.method === 'POST') {
                    readJsonBody<Record<string, unknown>>(req)
                        .then(body => {
                            const baseUrl = String(body.baseUrl || 'http://localhost:11434');
                            return proxyOllamaJson(baseUrl, '/api/generate', {
                                model: body.model,
                                prompt: '',
                                keep_alive: 0,
                                stream: false,
                            });
                        })
                        .then(result => sendJson(res, result.status, result.data))
                        .catch(error => sendJson(res, 200, { ok: false, error: `Unload request failed: ${String(error)}` }));
                    return;
                }

                if (url.startsWith('/api/comfyui/status')) {
                    const parsed = new URL(url, 'http://localhost');
                    const baseUrl = parsed.searchParams.get('baseUrl') || `http://${COMFYUI_HOST}:${COMFYUI_PORT}`;
                    fetch(`${baseUrl.replace(/\/$/, '')}/queue`, { signal: AbortSignal.timeout(3000) })
                        .then(async response => {
                            if (!response.ok) throw new Error(`HTTP ${response.status}`);
                            const data = await response.json() as { queue_running?: unknown[]; queue_pending?: unknown[] };
                            const queueRunning = Array.isArray(data.queue_running) ? data.queue_running.length : 0;
                            const queuePending = Array.isArray(data.queue_pending) ? data.queue_pending.length : 0;
                            sendJson(res, 200, {
                                running: true,
                                online: true,
                                busy: queueRunning > 0 || queuePending > 0,
                                queueRunning,
                                queuePending,
                                lastCheckedAt: new Date().toISOString(),
                                error: null,
                            });
                        })
                        .catch(error => {
                            sendJson(res, 200, {
                                running: false,
                                online: false,
                                busy: false,
                                queueRunning: 0,
                                queuePending: 0,
                                lastCheckedAt: new Date().toISOString(),
                                error: String(error),
                            });
                        });
                    return;
                }

                if (url === '/api/comfyui/prompt' && req.method === 'POST') {
                    readJsonBody<Record<string, unknown>>(req)
                        .then(body => sendJson(res, 200, { ok: true, prepared: body.payload || null }))
                        .catch(error => sendJson(res, 400, { ok: false, error: String(error) }));
                    return;
                }

                // ── API: List folders ──
                if (url === '/api/comfyui/folders') {
                    try {
                        const entries = fs.readdirSync(COMFYUI_OUTPUT_DIR, { withFileTypes: true });
                        const folders = entries
                            .filter(e => e.isDirectory())
                            .map(e => e.name);
                        res.setHeader('Content-Type', 'application/json');
                        res.setHeader('Access-Control-Allow-Origin', '*');
                        res.end(JSON.stringify(folders));
                    } catch (err) {
                        res.statusCode = 500;
                        res.end(JSON.stringify({ error: 'Cannot read ComfyUI output directory', detail: String(err) }));
                    }
                    return;
                }

                // ── API: List images in a folder ──
                if (url.startsWith('/api/comfyui/images')) {
                    const parsed = new URL(url, 'http://localhost');
                    const folder = parsed.searchParams.get('folder') || '';
                    const folderPath = path.join(COMFYUI_OUTPUT_DIR, folder);

                    // Security: prevent path traversal
                    if (!isSafe(folderPath, COMFYUI_OUTPUT_DIR)) {
                        res.statusCode = 403;
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify({ error: 'Forbidden', folderPath, base: COMFYUI_OUTPUT_DIR }));
                        return;
                    }

                    try {
                        const files = fs.readdirSync(folderPath)
                            .filter(f => /\.(png|jpg|jpeg|webp|gif)$/i.test(f));

                        const images = files.map(f => {
                            const filePath = path.join(folderPath, f);
                            const stat = fs.statSync(filePath);
                            
                            // Extract prompts
                            const metadata = f.toLowerCase().endsWith('.png') ? extractComfyMetadata(filePath) : {};

                            return {
                                filename: f,
                                folder,
                                size: stat.size,
                                modified: stat.mtimeMs,
                                url: `/comfyui-files/${encodeURIComponent(folder)}/${encodeURIComponent(f)}`,
                                ...metadata
                            };
                        });

                        // Sort newest first
                        images.sort((a, b) => b.modified - a.modified);

                        res.setHeader('Content-Type', 'application/json');
                        res.setHeader('Access-Control-Allow-Origin', '*');
                        res.end(JSON.stringify(images));
                    } catch (err) {
                        res.statusCode = 404;
                        res.end(JSON.stringify({ error: `Folder "${folder}" not found`, detail: String(err) }));
                    }
                    return;
                }

                // ── Static file serving ──
                if (url.startsWith('/comfyui-files/')) {
                    const relativePath = decodeURIComponent(url.replace('/comfyui-files/', ''));
                    const filePath = path.join(COMFYUI_OUTPUT_DIR, relativePath);

                    // Security: prevent path traversal
                    if (!isSafe(filePath, COMFYUI_OUTPUT_DIR)) {
                        res.statusCode = 403;
                        res.end('Forbidden');
                        return;
                    }

                    if (fs.existsSync(filePath)) {
                        const ext = path.extname(filePath).toLowerCase();
                        const mimeMap: Record<string, string> = {
                            '.png': 'image/png',
                            '.jpg': 'image/jpeg',
                            '.jpeg': 'image/jpeg',
                            '.webp': 'image/webp',
                            '.gif': 'image/gif',
                        };
                        res.setHeader('Content-Type', mimeMap[ext] || 'application/octet-stream');
                        res.setHeader('Cache-Control', 'public, max-age=3600');
                        res.setHeader('Access-Control-Allow-Origin', '*');
                        fs.createReadStream(filePath).pipe(res);
                    } else {
                        res.statusCode = 404;
                        res.end('Not found');
                    }
                    return;
                }

                // ── API: Image Proxy for external URLs (supports Range requests for video seeking) ──
                if (url.startsWith('/api/proxy-image')) {
                    const parsed = new URL(url, 'http://localhost');
                    const imageUrl = parsed.searchParams.get('url');

                    if (!imageUrl) {
                        res.statusCode = 400;
                        res.end(JSON.stringify({ error: 'Missing url parameter' }));
                        return;
                    }

                    // Only allow http/https URLs
                    if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
                        res.statusCode = 400;
                        res.end(JSON.stringify({ error: 'Invalid URL' }));
                        return;
                    }

                    const httpModule = imageUrl.startsWith('https') ? https : http;

                    // Build upstream headers — forward Range header if present for video seeking
                    const upstreamHeaders = getMediaProxyHeaders(imageUrl, req.headers['range'] as string | undefined);

                    /** Pipe an upstream response back to the client, preserving range/seek headers */
                    const pipeResponse = (proxyRes: any) => {
                        // Mirror the upstream status (200 or 206 for partial content)
                        res.statusCode = proxyRes.statusCode || 200;
                        if (proxyRes.headers['content-type']) {
                            res.setHeader('Content-Type', proxyRes.headers['content-type']);
                        }
                        if (proxyRes.headers['content-length']) {
                            res.setHeader('Content-Length', proxyRes.headers['content-length']);
                        }
                        // Forward range-related headers so the browser can seek
                        if (proxyRes.headers['content-range']) {
                            res.setHeader('Content-Range', proxyRes.headers['content-range']);
                        }
                        if (proxyRes.headers['accept-ranges']) {
                            res.setHeader('Accept-Ranges', proxyRes.headers['accept-ranges']);
                        } else {
                            res.setHeader('Accept-Ranges', 'bytes');
                        }
                        res.setHeader('Cache-Control', 'public, max-age=86400');
                        res.setHeader('Access-Control-Allow-Origin', '*');
                        proxyRes.pipe(res);
                    };

                    const proxyReq = httpModule.get(imageUrl, { 
                        headers: upstreamHeaders,
                        timeout: 30000,
                    }, (proxyRes: any) => {
                        if (proxyRes.statusCode >= 300 && proxyRes.statusCode < 400 && proxyRes.headers.location) {
                            // Follow redirects — also forward Range header
                            const redirectUrl = new URL(proxyRes.headers.location, imageUrl).toString();
                            const httpModule2 = redirectUrl.startsWith('https') ? https : http;
                            const redirectHeaders = getMediaProxyHeaders(redirectUrl, req.headers['range'] as string | undefined);
                            httpModule2.get(redirectUrl, {
                                headers: redirectHeaders,
                                timeout: 30000,
                            }, (redirectRes: any) => {
                                pipeResponse(redirectRes);
                            }).on('error', (err: any) => {
                                res.statusCode = 502;
                                res.end(JSON.stringify({ error: 'Redirect proxy failed', detail: String(err) }));
                            });
                            return;
                        }

                        pipeResponse(proxyRes);
                    });

                    proxyReq.on('error', (err: any) => {
                        console.error('Proxy error:', err.message);
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

                if (url.startsWith('/api/proxy-json')) {
                    const parsed = new URL(url, 'http://localhost');
                    const targetUrl = parsed.searchParams.get('url');

                    res.setHeader('Content-Type', 'application/json');
                    res.setHeader('Access-Control-Allow-Origin', '*');
                    res.setHeader('Cache-Control', 'public, max-age=30');

                    if (!targetUrl) {
                        res.statusCode = 400;
                        res.end(JSON.stringify({ error: 'Missing url parameter' }));
                        return;
                    }

                    try {
                        const upstreamUrl = new URL(targetUrl);
                        const isAllowedProtocol = upstreamUrl.protocol === 'http:' || upstreamUrl.protocol === 'https:';
                        if (!isAllowedProtocol || !JSON_PROXY_ALLOWED_HOSTS.has(upstreamUrl.hostname)) {
                            res.statusCode = 400;
                            res.end(JSON.stringify({ error: 'URL host is not allowed' }));
                            return;
                        }

                        fetchJsonThroughNode(upstreamUrl.toString())
                            .then(({ statusCode, body }) => {
                                res.statusCode = 200;
                                res.end(statusCode >= 400 ? JSON.stringify([]) : body || JSON.stringify([]));
                            })
                            .catch((err: any) => {
                                res.statusCode = 200;
                                res.end(JSON.stringify([]));
                            });
                    } catch (err) {
                        res.statusCode = 400;
                        res.end(JSON.stringify({ error: 'Invalid URL', detail: String(err) }));
                    }

                    return;
                }

                // ── API: Start ComfyUI ──
                if (url === '/api/comfyui/start' && req.method === 'POST') {
                    res.setHeader('Content-Type', 'application/json');
                    res.setHeader('Access-Control-Allow-Origin', '*');
                    
                    try {
                        // Check if already running first
                        const checkReq = http.get(`http://${COMFYUI_HOST}:${COMFYUI_PORT}/system_stats`, { timeout: 2000 }, (checkRes) => {
                            if (checkRes.statusCode === 200) {
                                res.end(JSON.stringify({ status: 'already_running', message: 'ComfyUI is already running' }));
                            }
                        });
                        checkReq.on('error', () => {
                            // Not running → start it
                            const batDir = path.dirname(COMFYUI_BAT_PATH);
                            const batFile = path.basename(COMFYUI_BAT_PATH);
                            exec(`start "" /D "${batDir}" "${batFile}"`, { cwd: batDir, windowsHide: false }, (error) => {
                                if (error) {
                                    console.error('Failed to start ComfyUI:', error);
                                    res.statusCode = 500;
                                    res.end(JSON.stringify({ status: 'error', message: String(error) }));
                                } else {
                                    res.end(JSON.stringify({ status: 'starting', message: 'ComfyUI is starting...' }));
                                }
                            });
                        });
                        checkReq.on('timeout', () => {
                            checkReq.destroy();
                        });
                    } catch (err) {
                        res.statusCode = 500;
                        res.end(JSON.stringify({ status: 'error', message: String(err) }));
                    }
                    return;
                }

                // ── API: Check ComfyUI status ──
                if (url === '/api/comfyui/status') {
                    res.setHeader('Content-Type', 'application/json');
                    res.setHeader('Access-Control-Allow-Origin', '*');
                    
                    const checkReq = http.get(`http://${COMFYUI_HOST}:${COMFYUI_PORT}/system_stats`, { timeout: 3000 }, (checkRes) => {
                        let body = '';
                        checkRes.on('data', (chunk: any) => { body += chunk; });
                        checkRes.on('end', () => {
                            if (checkRes.statusCode === 200) {
                                res.end(JSON.stringify({ running: true, systemStats: body }));
                            } else {
                                res.end(JSON.stringify({ running: false }));
                            }
                        });
                    });
                    checkReq.on('error', () => {
                        res.end(JSON.stringify({ running: false }));
                    });
                    checkReq.on('timeout', () => {
                        checkReq.destroy();
                        res.end(JSON.stringify({ running: false }));
                    });
                    return;
                }

                next();
            });
        },
    };
}
