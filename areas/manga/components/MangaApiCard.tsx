import React from 'react';
import type { MangaApiRegistryItem } from '../types/manga.types';

interface MangaApiCardProps {
  api: MangaApiRegistryItem;
}

const statusClasses: Record<MangaApiRegistryItem['status'], string> = {
  active: 'border-emerald-300/25 bg-emerald-500/10 text-emerald-100',
  planned: 'border-fuchsia-300/20 bg-fuchsia-500/10 text-fuchsia-100',
  disabled: 'border-gray-300/15 bg-white/5 text-gray-400',
  error: 'border-rose-300/25 bg-rose-500/10 text-rose-100',
};

export const MangaApiCard: React.FC<MangaApiCardProps> = ({ api }) => (
  <article className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 shadow-xl shadow-black/20 transition hover:-translate-y-0.5 hover:border-fuchsia-200/25 hover:bg-white/[0.055]">
    <div className="flex items-start justify-between gap-4">
      <div>
        <h3 className="text-lg font-black text-white">{api.name}</h3>
        <p className="mt-1 text-[10px] font-black uppercase tracking-[0.2em] text-fuchsia-200/75">{api.category}</p>
      </div>
      <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${statusClasses[api.status]}`}>
        {api.status}
      </span>
    </div>

    <p className="mt-4 text-sm leading-6 text-gray-400">{api.description}</p>

    <div className="mt-4 flex flex-wrap gap-1.5">
      {api.tags.map((tag) => (
        <span key={tag} className="rounded-full border border-white/10 bg-black/25 px-2 py-1 text-[10px] font-bold text-gray-300">
          {tag}
        </span>
      ))}
    </div>

    <div className="mt-4 space-y-2 text-xs text-gray-500">
      {api.baseUrl && <div className="truncate font-mono">{api.baseUrl}</div>}
      {api.docsUrl && (
        <a href={api.docsUrl} target="_blank" rel="noreferrer" className="inline-flex font-bold text-fuchsia-200/80 hover:text-fuchsia-100">
          API docs
        </a>
      )}
    </div>
  </article>
);
