import React from 'react';
import type { RawgGame } from '../types/games.types';
import type { UserGame } from '../types/games.types';

interface AddToGameLibraryButtonProps {
  game: RawgGame;
  savedGame?: UserGame;
  onAdd: (game: RawgGame) => void;
}

export const AddToGameLibraryButton: React.FC<AddToGameLibraryButtonProps> = ({ game, savedGame, onAdd }) => (
  <button onClick={() => onAdd(game)} className="rounded-xl bg-cyan-500/15 px-3 py-2 text-xs font-black text-cyan-100 hover:bg-cyan-500/25">
    {savedGame ? 'In Library' : 'Add'}
  </button>
);
