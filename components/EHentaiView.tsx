import React, { useState } from 'react';
import type { EHentaiGalleryError, EHentaiGalleryPagePreview, EHentaiGidToken, EHentaiNormalizedGallery, EHentaiParsedGallery } from '../services/ehentai';
import { getMultipleGalleries, parseEHentaiGalleryPages, parseEHentaiGalleryUrl, resolveEHentaiImagePage } from '../services/ehentai';
import { Spinner } from './Spinner';

interface EHentaiViewProps {
  onNavigateHome: () => void;
}

const inputClass = 'w-full rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#151515] px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-violet-500';
const buttonClass = 'rounded-xl px-4 py-2 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-40';

const getThumbnailSrc = (url: string | null): string => {
  if (!url) return '';
  return url.startsWith('http') ? `/api/proxy-image?url=${encodeURIComponent(url)}` : url;
};

const parseManualRows = (value: string): EHentaiGidToken[] => {
  return value
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .flatMap(line => {
      const parsedUrl = parseEHentaiGalleryUrl(line);
      if (parsedUrl) return [[parsedUrl.galleryId, parsedUrl.galleryToken] as EHentaiGidToken];

      const [gid, token] = line.split(/[,\s]+/).map(part => part.trim()).filter(Boolean);
      const numericGid = Number(gid);
      if (!Number.isFinite(numericGid) || !token) return [];
      return [[numericGid, token] as EHentaiGidToken];
    });
};

export const EHentaiView: React.FC<EHentaiViewProps> = ({ onNavigateHome }) => {
  const [galleryUrl, setGalleryUrl] = useState('');
  const [batchText, setBatchText] = useState('');
  const [useExHentai, setUseExHentai] = useState(false);
  const [cookies, setCookies] = useState('');
  const [galleries, setGalleries] = useState<EHentaiNormalizedGallery[]>([]);
  const [errors, setErrors] = useState<EHentaiGalleryError[]>([]);
  const [parsedGallery, setParsedGallery] = useState<EHentaiParsedGallery | null>(null);
  const [selectedPage, setSelectedPage] = useState<EHentaiGalleryPagePreview | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isReaderLoading, setIsReaderLoading] = useState(false);
  const [resolvingPageUrl, setResolvingPageUrl] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const loadSingle = async () => {
    const parsed = parseEHentaiGalleryUrl(galleryUrl);
    if (!parsed) {
      setMessage('URL invalida. Use o formato https://e-hentai.org/g/123456/token/');
      return;
    }

    setIsLoading(true);
    setMessage('');
    try {
      const result = await getMultipleGalleries([[parsed.galleryId, parsed.galleryToken]], {
        source: useExHentai ? 'exhentai' : parsed.source,
        cookies: cookies.trim() || undefined,
      });
      setGalleries(result.galleries);
      setErrors(result.errors);
      setParsedGallery(null);
      setSelectedPage(null);
      if (result.galleries.length === 0 && result.errors.length === 0) setMessage('Nenhuma gallery retornada.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Falha ao buscar metadata do E-Hentai.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadBatch = async () => {
    const gidlist = parseManualRows(batchText);
    if (gidlist.length === 0) {
      setMessage('Cole URLs ou linhas no formato: gid token');
      return;
    }

    setIsLoading(true);
    setMessage('');
    try {
      const result = await getMultipleGalleries(gidlist, {
        source: useExHentai ? 'exhentai' : 'e-hentai',
        cookies: cookies.trim() || undefined,
      });
      setGalleries(result.galleries);
      setErrors(result.errors);
      setParsedGallery(null);
      setSelectedPage(null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Falha ao buscar galleries em lote.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadReader = async (gallery: EHentaiNormalizedGallery, resolveFirstImages = false) => {
    setIsReaderLoading(true);
    setMessage('');
    try {
      const parsed = await parseEHentaiGalleryPages(gallery.url, {
        source: useExHentai ? 'exhentai' : gallery.sourceApi,
        cookies: cookies.trim() || undefined,
        maxGalleryPages: 40,
        resolveImageUrls: resolveFirstImages,
        maxImagePagesToResolve: 20,
      });
      setParsedGallery(parsed);
      setSelectedPage(parsed.pages[0] || null);
      if (parsed.pages.length === 0) setMessage('A gallery foi encontrada, mas nenhuma pagina foi extraida do HTML.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Falha ao carregar leitor HTML.');
    } finally {
      setIsReaderLoading(false);
    }
  };

  const resolvePage = async (page: EHentaiGalleryPagePreview) => {
    setResolvingPageUrl(page.pageUrl);
    try {
      const resolved = await resolveEHentaiImagePage(page.pageUrl, {
        source: useExHentai ? 'exhentai' : parsedGallery?.source,
        cookies: cookies.trim() || undefined,
      });
      const nextPage = {
        ...page,
        imageUrl: resolved.imageUrl,
        imageWidth: resolved.width,
        imageHeight: resolved.height,
        originalImageUrl: resolved.originalImageUrl,
        error: resolved.error,
      };
      setSelectedPage(nextPage);
      setParsedGallery(prev => prev ? {
        ...prev,
        pages: prev.pages.map(item => item.pageUrl === page.pageUrl ? nextPage : item),
      } : prev);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Falha ao resolver pagina de imagem.');
    } finally {
      setResolvingPageUrl(null);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-[#0a0a0a] text-gray-900 dark:text-gray-100">
      <header className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 border-b border-black/5 dark:border-white/5 bg-white/80 dark:bg-[#0a0a0a]/80 px-6 py-4 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button onClick={onNavigateHome} className="text-sm font-bold text-violet-500 hover:text-violet-400">Back</button>
          <h1 className="text-xl font-black tracking-tight">E-Hentai Metadata</h1>
        </div>
        <a href="https://e-hentai.org/" target="_blank" rel="noreferrer" className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-gray-500 hover:text-white">
          Open E-Hentai
        </a>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        <div className="mb-6 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-600 dark:text-amber-400">
          A API oficial retorna metadata e thumbnail. O leitor abaixo usa parser HTML da pagina da gallery para extrair thumbs e links das paginas internas; as imagens finais sao resolvidas sob demanda para evitar rajadas grandes de requests.
        </div>

        <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-white/80 dark:bg-[#111]/80 p-5 shadow-xl shadow-black/5">
            <h2 className="mb-4 text-sm font-black uppercase tracking-widest text-gray-500">Buscar por URL</h2>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                className={inputClass}
                value={galleryUrl}
                onChange={event => setGalleryUrl(event.target.value)}
                placeholder="https://e-hentai.org/g/123456/abcdef123/"
              />
              <button disabled={isLoading} onClick={loadSingle} className={`${buttonClass} bg-violet-600 text-white hover:bg-violet-700`}>
                Buscar
              </button>
            </div>

            <h2 className="mb-4 mt-6 text-sm font-black uppercase tracking-widest text-gray-500">Buscar em lote</h2>
            <textarea
              className={`${inputClass} min-h-36`}
              value={batchText}
              onChange={event => setBatchText(event.target.value)}
              placeholder={'Uma gallery por linha:\nhttps://e-hentai.org/g/123456/abcdef123/\n789012 deadbeef99'}
            />
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button disabled={isLoading} onClick={loadBatch} className={`${buttonClass} bg-white/5 text-gray-500 hover:text-white`}>
                Buscar lote
              </button>
              <label className="flex items-center gap-2 text-xs font-bold text-gray-500">
                <input type="checkbox" checked={useExHentai} onChange={event => setUseExHentai(event.target.checked)} />
                usar ExHentai
              </label>
            </div>
          </div>

          <aside className="rounded-2xl border border-black/5 dark:border-white/10 bg-white/80 dark:bg-[#111]/80 p-5 shadow-xl shadow-black/5">
            <h2 className="mb-4 text-sm font-black uppercase tracking-widest text-gray-500">ExHentai Cookies</h2>
            <textarea
              className={`${inputClass} min-h-32`}
              value={cookies}
              onChange={event => setCookies(event.target.value)}
              placeholder="ipb_member_id=...; ipb_pass_hash=...; igneous=..."
            />
            <p className="mt-3 text-xs text-gray-500">
              Opcional. Necessario apenas para galleries que exigem login no ExHentai.
            </p>
          </aside>
        </section>

        {(isLoading || message) && (
          <div className="mt-5 rounded-xl border border-violet-500/20 bg-violet-500/10 p-4 text-sm text-violet-300">
            {isLoading ? <div className="flex items-center gap-3"><Spinner /> <span>Buscando metadata...</span></div> : message}
          </div>
        )}

        {errors.length > 0 && (
          <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 p-4">
            <h3 className="mb-2 text-sm font-black text-red-400">Erros</h3>
            <div className="space-y-1 text-xs text-red-300">
              {errors.map(error => (
                <div key={`${error.gid}-${error.token || ''}`}>#{error.gid}: {error.error}</div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {galleries.map(gallery => (
            <article key={gallery.id} className="overflow-hidden rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-[#111] shadow-xl shadow-black/5">
              <div className="grid grid-cols-[130px_minmax(0,1fr)]">
                <div className="bg-black/10">
                  {gallery.thumbnailUrl ? (
                    <img src={getThumbnailSrc(gallery.thumbnailUrl)} alt={gallery.title} className="h-full min-h-48 w-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="flex h-full min-h-48 items-center justify-center text-xs text-gray-500">No thumb</div>
                  )}
                </div>
                <div className="min-w-0 p-4">
                  <div className="mb-2 flex flex-wrap gap-2">
                    <span className="rounded-full bg-violet-500/10 px-2 py-1 text-[10px] font-bold text-violet-400">{gallery.category}</span>
                    {gallery.expunged && <span className="rounded-full bg-red-500/10 px-2 py-1 text-[10px] font-bold text-red-400">Expunged</span>}
                  </div>
                  <h2 className="line-clamp-3 text-sm font-black">{gallery.title}</h2>
                  {gallery.titleJpn && <p className="mt-1 line-clamp-2 text-xs text-gray-500">{gallery.titleJpn}</p>}
                  <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-gray-500">
                    <div>Files: {gallery.fileCount}</div>
                    <div>Size: {gallery.fileSizeLabel}</div>
                    <div>Rating: {gallery.rating.toFixed(2)}</div>
                    <div>Torrents: {gallery.torrentCount}</div>
                  </div>
                  <a href={gallery.url} target="_blank" rel="noreferrer" className="mt-3 inline-flex rounded-xl bg-violet-600 px-3 py-2 text-xs font-bold text-white hover:bg-violet-700">
                    Abrir gallery
                  </a>
                  <button onClick={() => loadReader(gallery, false)} className="ml-2 mt-3 inline-flex rounded-xl bg-fuchsia-600 px-3 py-2 text-xs font-bold text-white hover:bg-fuchsia-700">
                    Carregar paginas
                  </button>
                </div>
              </div>
              <div className="border-t border-black/5 dark:border-white/10 p-4">
                <div className="flex max-h-28 flex-wrap gap-1 overflow-y-auto no-scrollbar">
                  {gallery.tags.slice(0, 80).map(tag => (
                    <span key={tag} className="rounded-full bg-neutral-100 dark:bg-white/5 px-2 py-1 text-[10px] text-gray-500">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>

        {isReaderLoading && (
          <div className="mt-6 rounded-xl border border-fuchsia-500/20 bg-fuchsia-500/10 p-4 text-sm text-fuchsia-300">
            <div className="flex items-center gap-3"><Spinner /> <span>Carregando paginas da gallery...</span></div>
          </div>
        )}

        {parsedGallery && (
          <section className="mt-8 rounded-2xl border border-black/5 dark:border-white/10 bg-white/80 dark:bg-[#111]/80 p-4 shadow-xl shadow-black/5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black">{parsedGallery.title || 'E-Hentai Reader'}</h2>
                <p className="text-xs text-gray-500">
                  {parsedGallery.pages.length} paginas extraidas de {parsedGallery.pageCount || parsedGallery.pages.length}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => {
                  const gallery = galleries.find(item => item.gid === parsedGallery.galleryId);
                  if (gallery) loadReader(gallery, true);
                }} className={`${buttonClass} bg-fuchsia-600 text-white hover:bg-fuchsia-700`}>
                  Resolver primeiras 20 imagens
                </button>
                <a href={parsedGallery.galleryUrl} target="_blank" rel="noreferrer" className={`${buttonClass} bg-white/5 text-gray-500 hover:text-white`}>
                  Abrir original
                </a>
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
              <div className="min-h-[60vh] rounded-xl bg-black/20 p-3">
                {selectedPage ? (
                  <div className="flex h-full flex-col items-center justify-center gap-3">
                    <div className="text-xs font-bold text-gray-500">Pagina {selectedPage.pageNumber}</div>
                    {selectedPage.imageUrl ? (
                      <img
                        src={getThumbnailSrc(selectedPage.imageUrl)}
                        alt={`Page ${selectedPage.pageNumber}`}
                        className="max-h-[72vh] max-w-full rounded-lg object-contain"
                        referrerPolicy="no-referrer"
                      />
                    ) : selectedPage.thumbnailUrl ? (
                      <img
                        src={getThumbnailSrc(selectedPage.thumbnailUrl)}
                        alt={`Thumbnail ${selectedPage.pageNumber}`}
                        className="max-h-[60vh] max-w-full rounded-lg object-contain opacity-80"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="text-sm text-gray-500">Sem imagem carregada.</div>
                    )}
                    <div className="flex flex-wrap justify-center gap-2">
                      <button disabled={resolvingPageUrl === selectedPage.pageUrl} onClick={() => resolvePage(selectedPage)} className={`${buttonClass} bg-violet-600 text-white hover:bg-violet-700`}>
                        {resolvingPageUrl === selectedPage.pageUrl ? 'Resolvendo...' : 'Carregar imagem final'}
                      </button>
                      <a href={selectedPage.pageUrl} target="_blank" rel="noreferrer" className={`${buttonClass} bg-white/5 text-gray-500 hover:text-white`}>
                        Abrir pagina
                      </a>
                      {selectedPage.originalImageUrl && (
                        <a href={selectedPage.originalImageUrl} target="_blank" rel="noreferrer" className={`${buttonClass} bg-white/5 text-gray-500 hover:text-white`}>
                          Original
                        </a>
                      )}
                    </div>
                    {selectedPage.error && <p className="text-xs text-red-400">{selectedPage.error}</p>}
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-gray-500">Selecione uma pagina.</div>
                )}
              </div>

              <aside className="max-h-[78vh] overflow-y-auto no-scrollbar rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="grid grid-cols-3 gap-2">
                  {parsedGallery.pages.map(page => (
                    <button
                      key={page.pageUrl}
                      onClick={() => setSelectedPage(page)}
                      className={`overflow-hidden rounded-lg border text-left transition ${selectedPage?.pageUrl === page.pageUrl ? 'border-violet-500 ring-2 ring-violet-500/30' : 'border-white/10 hover:border-violet-500/50'}`}
                    >
                      <div className="aspect-[2/3] bg-black/20">
                        {page.imageUrl || page.thumbnailUrl ? (
                          <img src={getThumbnailSrc(page.imageUrl || page.thumbnailUrl)} alt={`Page ${page.pageNumber}`} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-[10px] text-gray-500">No thumb</div>
                        )}
                      </div>
                      <div className="px-2 py-1 text-[10px] font-bold text-gray-500">#{page.pageNumber}</div>
                    </button>
                  ))}
                </div>
              </aside>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};
