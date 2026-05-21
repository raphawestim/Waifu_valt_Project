import React from 'react';
import type { DndApiReference } from '../types/rpg.types';

interface ClassSelectorProps {
  classes: DndApiReference[];
  value?: string;
  onChange: (value: string) => void;
}

export const ClassSelector: React.FC<ClassSelectorProps> = ({ classes, value, onChange }) => (
  <select value={value || ''} onChange={(event) => onChange(event.target.value)} className="h-12 rounded-2xl border border-white/10 bg-[#080812] px-3 text-sm font-bold text-white outline-none">
    <option value="">Choose class</option>
    {classes.map((item) => <option key={item.index} value={item.index}>{item.name}</option>)}
  </select>
);
