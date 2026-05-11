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
                    const upstreamHeaders: Record<string, string> = {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Accept': 'image/*,video/*,*/*',
                        'Accept-Language': 'en-US,en;q=0.9',
                        'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
                        'sec-ch-ua-mobile': '?0',
                        'sec-ch-ua-platform': '"Windows"',
                    };
                    if (req.headers['range']) {
                        upstreamHeaders['Range'] = req.headers['range'] as string;
                    }

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
                            const redirectUrl = proxyRes.headers.location;
                            const httpModule2 = redirectUrl.startsWith('https') ? https : http;
                            const redirectHeaders: Record<string, string> = {
                                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                                'Accept': 'image/*,video/*,*/*',
                            };
                            if (req.headers['range']) {
                                redirectHeaders['Range'] = req.headers['range'] as string;
                            }
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
