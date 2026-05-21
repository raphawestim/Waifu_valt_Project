import React from 'react';
import { BackToPortalButton } from '../../../shared/components/BackToPortalButton';

interface MangaReaderProps {
  onBackToPortal: () => void;
  onBackToMangaHome: () => void;
}

export const MangaReader: React.FC<MangaReaderProps> = ({ onBackToPortal, onBackToMangaHome }) => (
  <main className="min-h-screen bg-[#05050a] p-5 text-white">
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="flex flex-wrap gap-3">
        <BackToPortalButton onClick={onBackToPortal} tone="fuchsia" />
        <button onClick={onBackToMangaHome} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-black text-gray-200">
          Back to Manga Home
        </button>
      </div>
      <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-8">
        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-fuchsia-200">Manga Reader</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight">Reader shell ready</h1>
        <p className="mt-4 text-sm leading-7 text-gray-400">
          Reading mode is intentionally metadata-safe until an allowed source/chapter adapter is implemented. It will support vertical mode, single page mode, zoom, source attribution and progress updates.
        </p>
      </section>
    </div>
  </main>
);
