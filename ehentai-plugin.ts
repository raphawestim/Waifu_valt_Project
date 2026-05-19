import type { IncomingMessage, ServerResponse } from 'http';
import * as cheerio from 'cheerio';
import type { Plugin } from 'vite';

type EHentaiSource = 'e-hentai' | 'exhentai';

interface EHentaiProxyRequest {
  method: 'gdata';
  gidlist: Array<[number, string]>;
  namespace?: 0 | 1;
  source?: EHentaiSource;
  cookies?: string;
}

interface EHentaiParseGalleryRequest {
  galleryUrl: string;
  source?: EHentaiSource;
  cookies?: string;
  maxGalleryPages?: number;
  resolveImageUrls?: boolean;
  maxImagePagesToResolve?: number;
}

interface EHentaiResolveImagePageRequest {
  pageUrl: string;
  source?: EHentaiSource;
  cookies?: string;
}

interface EHentaiPagePreview {
  index: number;
  pageNumber: number;
  pageUrl: string;
  pageToken: string | null;
  galleryId: number;
  thumbnailUrl: string | null;
  thumbnailWidth?: number;
  thumbnailHeight?: number;
  imageUrl?: string | null;
  imageWidth?: number;
  imageHeight?: number;
  originalImageUrl?: string | null;
  error?: string | null;
}

const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

const readJsonBody = <T,>(req: IncomingMessage): Promise<T> => {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString('utf8');
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body || '{}') as T);
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
};

const sendJson = (res: ServerResponse, statusCode: number, payload: unknown): void => {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.end(JSON.stringify(payload));
};

const getApiEndpoint = (source?: EHentaiSource): string => {
  return source === 'exhentai' ? 'https://exhentai.org/api.php' : 'https://api.e-hentai.org/api.php';
};

const inferSource = (value: string, fallback: EHentaiSource = 'e-hentai'): EHentaiSource => {
  return value.includes('exhentai.org') ? 'exhentai' : fallback;
};

const headersFor = (targetUrl: string, cookies?: string): Record<string, string> => {
  const parsed = new URL(targetUrl);
  const origin = `${parsed.protocol}//${parsed.hostname}`;
  const headers: Record<string, string> = {
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Cache-Control': 'no-cache',
    'Referer': `${origin}/`,
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  };
  if (cookies) headers.Cookie = cookies;
  return headers;
};

const fetchText = async (url: string, cookies?: string): Promise<string> => {
  const response = await fetch(url, {
    headers: headersFor(url, cookies),
    signal: AbortSignal.timeout(25000),
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: HTTP ${response.status}`);
  }
  return text;
};

const absolutize = (href: string, baseUrl: string): string => new URL(href, baseUrl).toString();

const extractBackgroundUrl = (style?: string): string | null => {
  if (!style) return null;
  const match = style.match(/url\((['"]?)(.*?)\1\)/i);
  return match?.[2] || null;
};

const parsePageToken = (pageUrl: string): string | null => {
  const match = pageUrl.match(/\/s\/([a-zA-Z0-9]+)\//);
  return match?.[1] || null;
};

const parseGalleryIdFromPageUrl = (pageUrl: string): number => {
  const match = pageUrl.match(/\/s\/[a-zA-Z0-9]+\/(\d+)-/);
  return match ? Number(match[1]) : 0;
};

const parseGalleryPageCount = ($: cheerio.CheerioAPI): number => {
  const pageNumbers = $('#gdd td, .gpc, #gpc, .ptt td a')
    .map((_, element) => $(element).text())
    .get()
    .join(' ')
    .match(/\d+/g)
    ?.map(Number) || [];

  const fromPagination = $('.ptt td a')
    .map((_, element) => Number($(element).text()))
    .get()
    .filter(Number.isFinite);

  return Math.max(1, ...pageNumbers, ...fromPagination);
};

const parsePageCount = ($: cheerio.CheerioAPI, fallback: number): number => {
  const gpcText = $('.gpc').first().text();
  const match = gpcText.match(/of\s+([\d,]+)/i) || gpcText.match(/([\d,]+)\s+pages/i);
  if (match) return Number(match[1].replace(/,/g, ''));
  return fallback;
};

const parseThumbnailPages = (html: string, galleryUrl: string, galleryId: number): EHentaiPagePreview[] => {
  const $ = cheerio.load(html);
  const entries: EHentaiPagePreview[] = [];

  $('#gdt a[href*="/s/"], .gdtm a[href*="/s/"], .gdtl a[href*="/s/"]').each((_, anchor) => {
    const href = $(anchor).attr('href');
    if (!href) return;
    const pageUrl = absolutize(href, galleryUrl);
    const img = $(anchor).find('img').first();
    const styleThumb = extractBackgroundUrl($(anchor).find('div').first().attr('style')) || extractBackgroundUrl($(anchor).attr('style'));
    const thumbnailUrl = img.attr('data-src') || img.attr('src') || styleThumb;
    const pageNumberMatch = pageUrl.match(/-(\d+)$/);
    const pageNumber = pageNumberMatch ? Number(pageNumberMatch[1]) : entries.length + 1;

    entries.push({
      index: entries.length,
      pageNumber,
      pageUrl,
      pageToken: parsePageToken(pageUrl),
      galleryId: parseGalleryIdFromPageUrl(pageUrl) || galleryId,
      thumbnailUrl: thumbnailUrl ? absolutize(thumbnailUrl, galleryUrl) : null,
      thumbnailWidth: Number(img.attr('width')) || undefined,
      thumbnailHeight: Number(img.attr('height')) || undefined,
      error: null,
    });
  });

  return entries;
};

const uniquePages = (pages: EHentaiPagePreview[]): EHentaiPagePreview[] => {
  const seen = new Set<string>();
  return pages
    .filter(page => {
      if (seen.has(page.pageUrl)) return false;
      seen.add(page.pageUrl);
      return true;
    })
    .sort((a, b) => a.pageNumber - b.pageNumber)
    .map((page, index) => ({ ...page, index }));
};

const resolveImagePage = async (pageUrl: string, cookies?: string) => {
  const html = await fetchText(pageUrl, cookies);
  const $ = cheerio.load(html);
  const img = $('#img').first();
  const imageUrl = img.attr('src') ? absolutize(img.attr('src') || '', pageUrl) : null;
  const originalLink = $('#i7 a, a[href*="fullimg"], a[href*="fullimg.php"]').first().attr('href');
  const nextPageUrl = $('a#next, #i3 a').first().attr('href');

  return {
    pageUrl,
    imageUrl,
    originalImageUrl: originalLink ? absolutize(originalLink, pageUrl) : null,
    width: Number(img.attr('width')) || undefined,
    height: Number(img.attr('height')) || undefined,
    nextPageUrl: nextPageUrl ? absolutize(nextPageUrl, pageUrl) : null,
    error: imageUrl ? null : 'Could not find #img on the image page.',
  };
};

const parseGallery = async (body: EHentaiParseGalleryRequest) => {
  const parsedUrl = new URL(body.galleryUrl);
  const galleryMatch = parsedUrl.pathname.match(/\/g\/(\d+)\/([a-zA-Z0-9]+)\/?/);
  if (!galleryMatch) throw new Error('Invalid gallery URL.');

  const galleryId = Number(galleryMatch[1]);
  const galleryToken = galleryMatch[2];
  const source = body.source || inferSource(body.galleryUrl);
  const galleryHost = source === 'exhentai' ? 'exhentai.org' : 'e-hentai.org';
  const normalizedGalleryUrl = `https://${galleryHost}/g/${galleryId}/${galleryToken}/`;
  const firstHtml = await fetchText(normalizedGalleryUrl, body.cookies);
  const $ = cheerio.load(firstHtml);
  const galleryPageCount = Math.min(parseGalleryPageCount($), Math.max(1, body.maxGalleryPages || 20));
  const pageCountFallback = parseThumbnailPages(firstHtml, normalizedGalleryUrl, galleryId).length;
  const pageCount = parsePageCount($, pageCountFallback);
  const title = $('#gn').first().text().trim() || $('h1').first().text().trim();
  const titleJpn = $('#gj').first().text().trim() || null;

  let pages = parseThumbnailPages(firstHtml, normalizedGalleryUrl, galleryId);

  for (let pageIndex = 1; pageIndex < galleryPageCount; pageIndex += 1) {
    await sleep(350);
    const html = await fetchText(`${normalizedGalleryUrl}?p=${pageIndex}`, body.cookies);
    pages = [...pages, ...parseThumbnailPages(html, `${normalizedGalleryUrl}?p=${pageIndex}`, galleryId)];
  }

  pages = uniquePages(pages);

  if (body.resolveImageUrls) {
    const limit = Math.min(body.maxImagePagesToResolve || 20, pages.length);
    for (let i = 0; i < limit; i += 1) {
      await sleep(450);
      try {
        const resolved = await resolveImagePage(pages[i].pageUrl, body.cookies);
        pages[i] = {
          ...pages[i],
          imageUrl: resolved.imageUrl,
          imageWidth: resolved.width,
          imageHeight: resolved.height,
          originalImageUrl: resolved.originalImageUrl,
          error: resolved.error,
        };
      } catch (error) {
        pages[i] = {
          ...pages[i],
          error: error instanceof Error ? error.message : 'Failed to resolve image page.',
        };
      }
    }
  }

  return {
    galleryId,
    galleryToken,
    source,
    galleryUrl: normalizedGalleryUrl,
    title,
    titleJpn,
    pageCount,
    galleryPageCount,
    pages,
  };
};

const handleGdata = async (req: IncomingMessage, res: ServerResponse) => {
  const body = await readJsonBody<EHentaiProxyRequest>(req);
  if (body.method !== 'gdata') {
    sendJson(res, 400, { error: 'Unsupported E-Hentai API method.' });
    return;
  }

  if (!Array.isArray(body.gidlist) || body.gidlist.length === 0 || body.gidlist.length > 25) {
    sendJson(res, 400, { error: 'gidlist must contain between 1 and 25 galleries.' });
    return;
  }

  const upstreamBody = {
    method: 'gdata',
    gidlist: body.gidlist,
    namespace: body.namespace ?? 1,
  };

  const endpoint = getApiEndpoint(body.source);
  const headers = {
    ...headersFor(endpoint, body.cookies),
    'Content-Type': 'application/json',
    'Accept': 'application/json,text/plain,*/*',
    'Origin': body.source === 'exhentai' ? 'https://exhentai.org' : 'https://e-hentai.org',
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(upstreamBody),
    signal: AbortSignal.timeout(20000),
  });

  const text = await response.text();
  let data: unknown;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { error: 'E-Hentai returned a non-JSON response.', detail: text.slice(0, 500) };
  }

  sendJson(res, response.ok ? 200 : response.status, data);
};

export function ehentaiPlugin(): Plugin {
  return {
    name: 'ehentai-api-proxy',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || '';

        if (!url.startsWith('/api/ehentai/')) {
          next();
          return;
        }

        if (req.method === 'OPTIONS') {
          sendJson(res, 200, { ok: true });
          return;
        }

        if (req.method !== 'POST') {
          sendJson(res, 405, { error: 'Method not allowed' });
          return;
        }

        try {
          if (url === '/api/ehentai/gdata') {
            await handleGdata(req, res);
            return;
          }

          if (url === '/api/ehentai/parse-gallery') {
            const body = await readJsonBody<EHentaiParseGalleryRequest>(req);
            const parsed = await parseGallery(body);
            sendJson(res, 200, parsed);
            return;
          }

          if (url === '/api/ehentai/resolve-image-page') {
            const body = await readJsonBody<EHentaiResolveImagePageRequest>(req);
            if (!body.pageUrl || !/\/s\/[a-zA-Z0-9]+\//.test(body.pageUrl)) {
              sendJson(res, 400, { error: 'Invalid E-Hentai image page URL.' });
              return;
            }
            const resolved = await resolveImagePage(body.pageUrl, body.cookies);
            sendJson(res, 200, resolved);
            return;
          }

          sendJson(res, 404, { error: 'Unknown E-Hentai endpoint.' });
        } catch (error) {
          sendJson(res, 502, { error: error instanceof Error ? error.message : 'E-Hentai request failed.' });
        }
      });
    },
  };
}
