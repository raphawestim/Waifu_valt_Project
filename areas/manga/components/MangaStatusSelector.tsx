import React from 'react';
import type { MangaLibraryStatus } from '../../../shared/storage/userCollectionsService';

interface MangaStatusSelectorProps {
  value: MangaLibraryStatus;
  onChange: (value: MangaLibraryStatus) => void;
}

export const mangaStatusLabels: Record<MangaLibraryStatus, string> = {
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
    onChange={(event) => onChange(event.target.value as MangaLibraryStatus)}
    className="h-10 rounded-xl border border-white/10 bg-[#080812] px-3 text-xs font-bold text-white outline-none focus:border-fuchsia-300/50"
  >
    {(Object.keys(mangaStatusLabels) as MangaLibraryStatus[]).map((status) => (
      <option key={status} value={status}>
        {mangaStatusLabels[status]}
      </option>
    ))}
  </select>
);
