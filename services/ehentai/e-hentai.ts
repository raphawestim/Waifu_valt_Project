import type {
  EHentaiApiErrorEntry,
  EHentaiApiGallery,
  EHentaiApiRequest,
  EHentaiApiResponse,
  EHentaiBatchResult,
  EHentaiClientOptions,
  EHentaiGalleryError,
  EHentaiGidToken,
  EHentaiNormalizedGallery,
  EHentaiParsedGallery,
  EHentaiReaderOptions,
  EHentaiResolvedImagePage,
  EHentaiSource,
  EHentaiTagGroup,
  ParsedEHentaiGalleryUrl,
} from './types';

const MAX_GALLERIES_PER_REQUEST = 25;
const DEFAULT_PROXY_ENDPOINT = '/api/ehentai/gdata';
const DEFAULT_GALLERY_PARSE_ENDPOINT = '/api/ehentai/parse-gallery';
const DEFAULT_IMAGE_PAGE_ENDPOINT = '/api/ehentai/resolve-image-page';
const DEFAULT_RETRIES = 3;
const DEFAULT_BASE_DELAY_MS = 800;
const DEFAULT_REQUEST_COOLDOWN_MS = 5000;
const DEFAULT_REQUESTS_BEFORE_COOLDOWN = 4;

const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

const chunk = <T,>(items: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
};

const isErrorEntry = (entry: EHentaiApiGallery | EHentaiApiErrorEntry): entry is EHentaiApiErrorEntry => {
  return 'error' in entry;
};

const parseNumber = (value: string | number | undefined, fallback = 0): number => {
  if (value === undefined) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const formatBytes = (bytes: number): string => {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
};

const getSourceHost = (source: EHentaiSource): string => source === 'exhentai' ? 'exhentai.org' : 'e-hentai.org';

const normalizeSource = (options: EHentaiClientOptions = {}): EHentaiSource => {
  if (options.useExHentai) return 'exhentai';
  return options.source || 'e-hentai';
};

const tagsToGroups = (tags: string[]): EHentaiTagGroup[] => {
  const grouped = new Map<string, string[]>();

  tags.forEach(tag => {
    const [maybeNamespace, ...rest] = tag.split(':');
    const hasNamespace = rest.length > 0;
    const namespace = hasNamespace ? maybeNamespace : 'misc';
    const value = hasNamespace ? rest.join(':') : tag;
    grouped.set(namespace, [...(grouped.get(namespace) || []), value]);
  });

  return [...grouped.entries()].map(([namespace, values]) => ({
    namespace,
    tags: values,
  }));
};

const parentRef = (gid?: string, token?: string): { gid: number; token: string } | null => {
  const parsedGid = parseNumber(gid);
  if (!parsedGid || !token) return null;
  return { gid: parsedGid, token };
};

const normalizeGallery = (gallery: EHentaiApiGallery, source: EHentaiSource): EHentaiNormalizedGallery => {
  const gid = parseNumber(gallery.gid);
  const posted = parseNumber(gallery.posted);
  const fileCount = parseNumber(gallery.filecount);
  const rating = parseNumber(gallery.rating);
  const torrentCount = parseNumber(gallery.torrentcount);
  const url = `https://${getSourceHost(source)}/g/${gid}/${gallery.token}/`;
  const tags = gallery.tags || [];

  return {
    id: `${source}-${gid}`,
    gid,
    token: gallery.token,
    sourceApi: source,
    url,
    title: gallery.title,
    titleJpn: gallery.title_jpn || null,
    category: gallery.category,
    thumbnailUrl: gallery.thumb || null,
    uploader: gallery.uploader || null,
    posted,
    postedAt: posted ? new Date(posted * 1000).toISOString() : '',
    fileCount,
    fileSizeBytes: gallery.filesize,
    fileSizeLabel: formatBytes(gallery.filesize),
    expunged: Boolean(gallery.expunged),
    rating,
    torrentCount,
    tags,
    tagGroups: tagsToGroups(tags),
    parent: parentRef(gallery.parent_gid, gallery.parent_key),
    current: parentRef(gallery.current_gid, gallery.current_key),
    first: parentRef(gallery.first_gid, gallery.first_key),
    raw: gallery,
  };
};

const normalizeError = (entry: EHentaiApiErrorEntry, token?: string): EHentaiGalleryError => {
  const message = entry.error || 'Unknown E-Hentai API error';
  const removed = /missing|incorrect|not found|expunged|removed|private/i.test(message);
  return {
    gid: entry.gid,
    token,
    error: message,
    removed,
  };
};

let requestQueue = Promise.resolve();
let sequentialRequestCount = 0;

const enqueue = async <T,>(task: () => Promise<T>): Promise<T> => {
  const next = requestQueue.then(task, task);
  requestQueue = next.then(() => undefined, () => undefined);
  return next;
};

const fetchWithRetry = async (
  gidlist: EHentaiGidToken[],
  options: Required<Pick<EHentaiClientOptions, 'maxRetries' | 'baseDelayMs' | 'proxyEndpoint' | 'requestCooldownMs' | 'requestsBeforeCooldown'>> & EHentaiClientOptions,
): Promise<EHentaiApiResponse> => {
  let attempt = 0;

  while (true) {
    try {
      sequentialRequestCount += 1;
      if (sequentialRequestCount > options.requestsBeforeCooldown) {
        sequentialRequestCount = 1;
        await sleep(options.requestCooldownMs);
      }

      const body: EHentaiApiRequest & { source: EHentaiSource; cookies?: string } = {
        method: 'gdata',
        gidlist,
        namespace: options.namespace ?? 1,
        source: normalizeSource(options),
      };
      if (options.cookies) body.cookies = options.cookies;

      const response = await fetch(options.proxyEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json() as EHentaiApiResponse;
      if (!response.ok || data.error) {
        throw new Error(data.error || `E-Hentai API request failed with status ${response.status}`);
      }

      return data;
    } catch (error) {
      attempt += 1;
      if (attempt > options.maxRetries) {
        throw error;
      }
      const delay = options.baseDelayMs * 2 ** (attempt - 1) + Math.floor(Math.random() * 250);
      await sleep(delay);
    }
  }
};

export const parseEHentaiGalleryUrl = (url: string): ParsedEHentaiGalleryUrl | null => {
  try {
    const parsed = new URL(url.trim());
    const match = parsed.pathname.match(/\/g\/(\d+)\/([a-zA-Z0-9]+)\/?/);
    if (!match) return null;
    const source: EHentaiSource = parsed.hostname.includes('exhentai') ? 'exhentai' : 'e-hentai';
    return {
      galleryId: Number(match[1]),
      galleryToken: match[2],
      source,
    };
  } catch {
    const match = url.trim().match(/(?:e-hentai\.org|exhentai\.org)\/g\/(\d+)\/([a-zA-Z0-9]+)\/?/i);
    if (!match) return null;
    return {
      galleryId: Number(match[1]),
      galleryToken: match[2],
      source: url.includes('exhentai.org') ? 'exhentai' : 'e-hentai',
    };
  }
};

export const getMultipleGalleries = async (
  gidlist: EHentaiGidToken[],
  options: EHentaiClientOptions = {},
): Promise<EHentaiBatchResult> => {
  if (gidlist.length === 0) return { galleries: [], errors: [] };

  const source = normalizeSource(options);
  const runtimeOptions = {
    maxRetries: options.maxRetries ?? DEFAULT_RETRIES,
    baseDelayMs: options.baseDelayMs ?? DEFAULT_BASE_DELAY_MS,
    proxyEndpoint: options.proxyEndpoint ?? DEFAULT_PROXY_ENDPOINT,
    requestCooldownMs: options.requestCooldownMs ?? DEFAULT_REQUEST_COOLDOWN_MS,
    requestsBeforeCooldown: options.requestsBeforeCooldown ?? DEFAULT_REQUESTS_BEFORE_COOLDOWN,
    ...options,
    source,
  };

  const galleries: EHentaiNormalizedGallery[] = [];
  const errors: EHentaiGalleryError[] = [];

  await enqueue(async () => {
    for (const gidChunk of chunk(gidlist, MAX_GALLERIES_PER_REQUEST)) {
      const data = await fetchWithRetry(gidChunk, runtimeOptions);
      const metadata = data.gmetadata || [];

      metadata.forEach(entry => {
        if (isErrorEntry(entry)) {
          const matchingToken = gidChunk.find(([gid]) => gid === entry.gid)?.[1];
          errors.push(normalizeError(entry, matchingToken));
          return;
        }

        if (entry.expunged) {
          errors.push({
            gid: parseNumber(entry.gid),
            token: entry.token,
            error: 'Gallery is expunged or unavailable.',
            removed: true,
          });
        }

        galleries.push(normalizeGallery(entry, source));
      });
    }
  });

  return { galleries, errors };
};

export const getGalleryMetadata = async (
  galleryId: number,
  galleryToken: string,
  options: EHentaiClientOptions = {},
): Promise<EHentaiNormalizedGallery> => {
  const result = await getMultipleGalleries([[galleryId, galleryToken]], options);
  if (result.galleries[0]) return result.galleries[0];

  const error = result.errors[0];
  throw new Error(error?.error || `Gallery ${galleryId} was not returned by the E-Hentai API.`);
};

export const getGalleryMetadataFromUrl = async (
  url: string,
  options: EHentaiClientOptions = {},
): Promise<EHentaiNormalizedGallery> => {
  const parsed = parseEHentaiGalleryUrl(url);
  if (!parsed) {
    throw new Error('Invalid E-Hentai gallery URL. Expected https://e-hentai.org/g/{gallery_id}/{gallery_token}/');
  }
  return getGalleryMetadata(parsed.galleryId, parsed.galleryToken, {
    ...options,
    source: options.source || parsed.source,
  });
};

export const parseEHentaiGalleryPages = async (
  galleryUrl: string,
  options: EHentaiReaderOptions = {},
): Promise<EHentaiParsedGallery> => {
  const parsed = parseEHentaiGalleryUrl(galleryUrl);
  if (!parsed) {
    throw new Error('Invalid E-Hentai gallery URL. Expected https://e-hentai.org/g/{gallery_id}/{gallery_token}/');
  }

  const response = await fetch(DEFAULT_GALLERY_PARSE_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      galleryUrl,
      source: options.source || parsed.source,
      cookies: options.cookies,
      maxGalleryPages: options.maxGalleryPages,
      resolveImageUrls: options.resolveImageUrls,
      maxImagePagesToResolve: options.maxImagePagesToResolve,
    }),
  });

  const data = await response.json() as EHentaiParsedGallery & { error?: string };
  if (!response.ok || data.error) {
    throw new Error(data.error || `Failed to parse E-Hentai gallery with status ${response.status}`);
  }

  return data;
};

export const resolveEHentaiImagePage = async (
  pageUrl: string,
  options: EHentaiReaderOptions = {},
): Promise<EHentaiResolvedImagePage> => {
  const response = await fetch(DEFAULT_IMAGE_PAGE_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      pageUrl,
      source: options.source,
      cookies: options.cookies,
    }),
  });

  const data = await response.json() as EHentaiResolvedImagePage & { error?: string };
  if (!response.ok || data.error) {
    throw new Error(data.error || `Failed to resolve E-Hentai image page with status ${response.status}`);
  }

  return data;
};
