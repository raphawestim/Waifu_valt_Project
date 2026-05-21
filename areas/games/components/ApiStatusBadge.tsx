import React from 'react';
import type { ApiStatus } from '../types/games.types';

interface ApiStatusBadgeProps {
  status: ApiStatus;
}

const statusClasses: Record<ApiStatus, string> = {
  active: 'border-emerald-300/25 bg-emerald-500/10 text-emerald-100',
  planned: 'border-cyan-300/20 bg-cyan-500/10 text-cyan-100',
  disabled: 'border-gray-300/15 bg-white/5 text-gray-400',
  error: 'border-rose-300/25 bg-rose-500/10 text-rose-100',
};

export const ApiStatusBadge: React.FC<ApiStatusBadgeProps> = ({ status }) => (
  <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${statusClasses[status]}`}>
    {status}
  </span>
);
