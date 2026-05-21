import React from 'react';
import type { MangaAnimeSearchResult } from '../types/manga.types';
import type { MangaLibraryStatus } from '../../../shared/storage/userCollectionsService';

interface AddToMangaLibraryButtonProps {
  item: MangaAnimeSearchResult;
  status: MangaLibraryStatus;
  onAdd: (item: MangaAnimeSearchResult, status: MangaLibraryStatus) => void;
}

export const AddToMangaLibraryButton: React.FC<AddToMangaLibraryButtonProps> = ({ item, status, onAdd }) => (
  <button onClick={() => onAdd(item, status)} className="rounded-xl bg-fuchsia-500/15 px-3 py-2 text-xs font-black text-fuchsia-100 hover:bg-fuchsia-500/25">
    Add to Library
  </button>
);
