import React from 'react';
import type { MangaMediaItem, UserMangaStatus } from '../types/manga.types';

interface AddToMangaLibraryButtonProps {
  item: MangaMediaItem;
  status: UserMangaStatus;
  onAdd: (item: MangaMediaItem, status: UserMangaStatus) => void;
}

export const AddToMangaLibraryButton: React.FC<AddToMangaLibraryButtonProps> = ({ item, status, onAdd }) => (
  <button onClick={() => onAdd(item, status)} className="rounded-xl bg-fuchsia-500/15 px-3 py-2 text-xs font-black text-fuchsia-100 hover:bg-fuchsia-500/25">
    Add to Library
  </button>
);
