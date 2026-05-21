import React from 'react';

interface BackToPortalButtonProps {
  onClick: () => void;
  tone?: 'cyan' | 'fuchsia' | 'violet';
}

const toneClasses: Record<NonNullable<BackToPortalButtonProps['tone']>, string> = {
  cyan: 'border-cyan-300/25 bg-cyan-500/10 text-cyan-100 hover:bg-cyan-500/20',
  fuchsia: 'border-fuchsia-300/25 bg-fuchsia-500/10 text-fuchsia-100 hover:bg-fuchsia-500/20',
  violet: 'border-violet-300/25 bg-violet-500/10 text-violet-100 hover:bg-violet-500/20',
};

export const BackToPortalButton: React.FC<BackToPortalButtonProps> = ({ onClick, tone = 'violet' }) => (
  <button
    type="button"
    onClick={onClick}
    className={`inline-flex h-10 items-center justify-center rounded-full border px-4 text-xs font-black uppercase tracking-[0.16em] transition ${toneClasses[tone]}`}
  >
    Back to Main Menu
  </button>
);
