import React from 'react';
import type { AppArea } from '../../types/app.types';

interface TheValtAreaSwitchButtonProps {
  targetArea: AppArea;
  label: string;
  caption: string;
  onClick: () => void;
}

export const TheValtAreaSwitchButton: React.FC<TheValtAreaSwitchButtonProps> = ({
  targetArea,
  label,
  caption,
  onClick,
}) => {
  const isNsfwTarget = targetArea === 'nsfw';
  const iconLabel = targetArea === 'portal' ? 'TV' : targetArea === 'manga' ? 'MA' : targetArea === 'games' ? 'GV' : '18+';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`fixed bottom-4 left-4 z-50 flex items-center gap-3 rounded-2xl border px-3 py-2 text-left shadow-2xl backdrop-blur-xl transition hover:-translate-y-0.5 sm:bottom-6 sm:left-6 ${
        isNsfwTarget
          ? 'border-red-500/20 bg-black/55 text-red-100 hover:border-red-400/40 hover:bg-red-950/35'
          : 'border-violet-400/20 bg-black/55 text-violet-100 hover:border-violet-300/40 hover:bg-violet-950/35'
      }`}
      aria-label={label}
    >
      <span
        className={`flex h-9 w-9 items-center justify-center rounded-xl border text-xs font-black uppercase tracking-[0.18em] ${
          isNsfwTarget
            ? 'border-red-400/20 bg-red-500/10 text-red-300'
            : 'border-violet-300/20 bg-violet-500/10 text-violet-200'
        }`}
      >
        {iconLabel}
      </span>
      <span className="hidden sm:block">
        <span className="block text-xs font-black uppercase tracking-[0.18em]">{label}</span>
        <span className="block text-[10px] font-medium text-gray-500">{caption}</span>
      </span>
    </button>
  );
};
