import React from 'react';

interface SectionHeaderProps {
  eyebrow: string;
  title: string;
  description?: string;
  tone?: 'cyan' | 'fuchsia' | 'emerald' | 'rose';
  action?: React.ReactNode;
}

const toneClasses: Record<NonNullable<SectionHeaderProps['tone']>, string> = {
  cyan: 'text-cyan-200',
  fuchsia: 'text-fuchsia-200',
  emerald: 'text-emerald-200',
  rose: 'text-rose-200',
};

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  eyebrow,
  title,
  description,
  tone = 'cyan',
  action,
}) => (
  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
    <div>
      <p className={`text-[10px] font-black uppercase tracking-[0.24em] ${toneClasses[tone]}`}>{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-black tracking-tight text-white">{title}</h2>
      {description && <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-400">{description}</p>}
    </div>
    {action}
  </div>
);
