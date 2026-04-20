import type { Plugin } from 'vite';
import fs from 'fs';
import path from 'path';

const COMFYUI_OUTPUT_DIR = path.normalize('C:/Users/Raphael/Documents/ComfyUI/ComfyUI/output');

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

                next();
            });
        },
    };
}
