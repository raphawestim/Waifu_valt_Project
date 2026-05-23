import React from 'react';

import type { VaultAccent } from '../../../data/vaultRegistry';

interface VaultChoiceCardProps {
  title: string;
  subtitle: string;
  description: string;
  buttonLabel: string;
  accent: VaultAccent;
  badge?: string;
  status?: 'Active' | 'Beta' | 'Planned' | 'active' | 'beta' | 'planned';
  locked?: boolean;
  disabled?: boolean;
  onEnter: () => void;
}

const accentStyles: Record<VaultChoiceCardProps['accent'], { shell: string; button: string; glow: string; mark: string }> = {
  cyan: {
    shell: 'border-cyan-300/25 from-cyan-500/16 via-blue-500/8 to-transparent hover:border-cyan-200/45',
    button: 'from-cyan-500 to-blue-600 shadow-cyan-950/35',
    glow: 'bg-cyan-400/20',
    mark: 'bg-cyan-300',
  },
  violet: {
    shell: 'border-violet-300/25 from-violet-500/16 via-amber-500/8 to-transparent hover:border-violet-200/45',
    button: 'from-violet-600 to-amber-500 shadow-violet-950/35',
    glow: 'bg-violet-300/20',
    mark: 'bg-violet-300',
  },
  magenta: {
    shell: 'border-fuchsia-300/25 from-fuchsia-500/16 via-violet-500/8 to-transparent hover:border-fuchsia-200/45',
    button: 'from-fuchsia-500 to-violet-600 shadow-fuchsia-950/35',
    glow: 'bg-fuchsia-400/20',
    mark: 'bg-fuchsia-300',
  },
  amber: {
    shell: 'border-red-300/25 from-red-500/14 via-amber-500/10 to-transparent hover:border-amber-200/45',
    button: 'from-red-700 to-amber-600 shadow-red-950/35',
    glow: 'bg-amber-500/20',
    mark: 'bg-red-300',
  },
  emerald: {
    shell: 'border-emerald-300/25 from-emerald-500/14 via-cyan-500/8 to-transparent hover:border-emerald-200/45',
    button: 'from-emerald-500 to-cyan-600 shadow-emerald-950/35',
    glow: 'bg-emerald-400/20',
    mark: 'bg-emerald-300',
  },
  rose: {
    shell: 'border-rose-300/25 from-rose-500/12 via-violet-500/8 to-transparent hover:border-rose-200/40',
    button: 'from-rose-600 to-red-700 shadow-rose-950/35',
    glow: 'bg-rose-500/18',
    mark: 'bg-rose-300',
  },
};

export const VaultChoiceCard: React.FC<VaultChoiceCardProps> = ({
  title,
  subtitle,
  description,
  buttonLabel,
  accent,
  badge,
  status,
  locked,
  disabled,
  onEnter,
}) => {
  const styles = accentStyles[accent];
  const isDisabled = Boolean(disabled);

  return (
    <article
      className={`group relative flex min-h-[22rem] flex-col justify-between overflow-hidden rounded-3xl border bg-gradient-to-br p-6 shadow-2xl shadow-black/35 backdrop-blur-xl transition duration-300 ${locked ? 'opacity-75 grayscale-[0.2]' : 'hover:-translate-y-1'} ${styles.shell}`}
    >
      <div className={`absolute inset-x-8 top-0 h-px ${styles.glow}`} />
      <div className={`absolute -right-12 bottom-8 h-40 w-40 rounded-full blur-3xl ${styles.glow}`} />
      <div className={`absolute left-6 top-6 h-2 w-10 rounded-full ${styles.mark}`} />

      <div className="relative pt-6">
        <div className="mb-5 flex flex-wrap items-center gap-2">
          {status && (
            <span className="rounded-full border border-white/10 bg-white/[0.07] px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-gray-100">
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
          )}
          {badge && (
            <span className="rounded-full border border-rose-300/30 bg-rose-500/12 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-rose-100">
              {badge}
            </span>
          )}
          {locked && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-gray-100">
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4m-2 0h12v10H6V11z" />
              </svg>
              Locked
            </span>
          )}
        </div>

        <p className="max-w-[13rem] text-[10px] font-black uppercase leading-5 tracking-[0.22em] text-gray-400">
          {subtitle}
        </p>
        <h2 className="mt-5 text-3xl font-black leading-tight tracking-tight text-white">{title}</h2>
        <p className="mt-4 text-sm leading-7 text-gray-300">{description}</p>
      </div>

      <button
        type="button"
        onClick={isDisabled ? undefined : onEnter}
        disabled={isDisabled}
        className={`relative mt-8 inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-gradient-to-r px-4 py-3 text-center text-xs font-black uppercase leading-5 tracking-[0.12em] text-white shadow-xl transition ${isDisabled ? 'cursor-not-allowed from-gray-700 to-gray-800 text-gray-300 opacity-80' : `group-hover:scale-[1.01] ${styles.button}`}`}
      >
        {isDisabled ? 'Locked' : buttonLabel}
      </button>
    </article>
  );
};
