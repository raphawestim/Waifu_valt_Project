import React from 'react';
import type { GamePersonalStatus } from '../types/games.types';

interface GameStatusSelectorProps {
  value: GamePersonalStatus;
  onChange: (value: GamePersonalStatus) => void;
}

export const gameStatusLabels: Record<GamePersonalStatus, string> = {
  never_played: 'Never Played',
  plan_to_play: 'Plan to Play',
  wishlist: 'Wishlist',
  playing: 'Playing',
  finished: 'Finished',
  completed: 'Completed',
  platinum: 'Platinum',
};

export const GameStatusSelector: React.FC<GameStatusSelectorProps> = ({ value, onChange }) => (
  <select
    value={value}
    onChange={(event) => onChange(event.target.value as GameLibraryStatus)}
    className="h-10 rounded-xl border border-white/10 bg-[#080812] px-3 text-xs font-bold text-white outline-none focus:border-cyan-300/50"
  >
    {(Object.keys(gameStatusLabels) as GamePersonalStatus[]).map((status) => (
      <option key={status} value={status}>
        {gameStatusLabels[status]}
      </option>
    ))}
  </select>
);
