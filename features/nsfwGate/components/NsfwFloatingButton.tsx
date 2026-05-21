import React from 'react';

interface NsfwFloatingButtonProps {
  onClick: () => void;
}

export const NsfwFloatingButton: React.FC<NsfwFloatingButtonProps> = ({ onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="fixed bottom-4 left-4 z-50 flex items-center gap-3 rounded-2xl border border-rose-500/20 bg-black/55 px-3 py-2 text-left text-rose-100 shadow-2xl backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-rose-400/40 hover:bg-rose-950/35 sm:bottom-6 sm:left-6"
    aria-label="Open The Vault NSFW"
  >
    <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-rose-400/20 bg-rose-500/10 text-xs font-black uppercase tracking-[0.18em] text-rose-300">
      18+
    </span>
    <span className="hidden sm:block">
      <span className="block text-xs font-black uppercase tracking-[0.18em]">The Vault NSFW</span>
      <span className="block text-[10px] font-medium text-gray-500">Adult vault access</span>
    </span>
  </button>
);
