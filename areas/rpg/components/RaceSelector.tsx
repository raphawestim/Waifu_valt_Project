import React from 'react';
import type { DndApiReference } from '../types/rpg.types';

interface RaceSelectorProps {
  races: DndApiReference[];
  value?: string;
  onChange: (value: string) => void;
}

export const RaceSelector: React.FC<RaceSelectorProps> = ({ races, value, onChange }) => (
  <select value={value || ''} onChange={(event) => onChange(event.target.value)} className="h-12 rounded-2xl border border-white/10 bg-[#080812] px-3 text-sm font-bold text-white outline-none">
    <option value="">Choose race</option>
    {races.map((item) => <option key={item.index} value={item.index}>{item.name}</option>)}
  </select>
);
