import React from 'react';
import type { UserMangaStatus } from '../types/manga.types';

interface MangaStatusSelectorProps {
  value: UserMangaStatus;
  onChange: (value: UserMangaStatus) => void;
}

export const mangaStatusLabels: Record<UserMangaStatus, string> = {
  favorite: 'Favorite',
  want_to_read: 'Want to Read',
  reading: 'Reading',
  completed: 'Completed',
  paused: 'Paused',
  dropped: 'Dropped',
};

export const MangaStatusSelector: React.FC<MangaStatusSelectorProps> = ({ value, onChange }) => (
  <select
    value={value}
    onChange={(event) => onChange(event.target.value as UserMangaStatus)}
    className="h-10 rounded-xl border border-white/10 bg-[#080812] px-3 text-xs font-bold text-white outline-none focus:border-fuchsia-300/50"
  >
    {(Object.keys(mangaStatusLabels) as UserMangaStatus[]).map((status) => (
      <option key={status} value={status}>
        {mangaStatusLabels[status]}
      </option>
    ))}
  </select>
);
