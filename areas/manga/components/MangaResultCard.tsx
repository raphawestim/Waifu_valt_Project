import React from 'react';
import type { MangaAnimeSearchResult } from '../types/manga.types';

interface MangaResultCardProps {
  result: MangaAnimeSearchResult;
}

export const MangaResultCard: React.FC<MangaResultCardProps> = ({ result }) => (
  <article className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
    {result.imageUrl && <img src={result.imageUrl} alt={result.title} className="h-64 w-full object-cover object-top" loading="lazy" />}
    <div className="p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-black uppercase tracking-[0.16em] text-fuchsia-200">{result.source}</span>
        <span className="rounded-full border border-white/10 bg-black/25 px-2 py-1 text-[10px] font-black uppercase text-gray-300">
          {result.kind}
        </span>
      </div>
      <h3 className="mt-2 text-base font-black text-white">{result.title}</h3>
      <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-bold text-gray-500">
        {result.year && <span>{result.year}</span>}
        {result.score && <span>Score {result.score}</span>}
        {result.status && <span>{result.status.replace(/_/g, ' ')}</span>}
      </div>
      {result.description && <p className="mt-3 line-clamp-5 text-xs leading-5 text-gray-400">{result.description}</p>}
      <a href={result.sourceUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex text-xs font-black uppercase tracking-[0.14em] text-fuchsia-200 hover:text-fuchsia-100">
        Open source
      </a>
    </div>
  </article>
);
