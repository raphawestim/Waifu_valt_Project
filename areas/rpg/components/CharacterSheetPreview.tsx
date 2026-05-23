import React from 'react';
import type { UserRpgCharacter } from '../types/rpg.types';

interface CharacterSheetPreviewProps {
  character: UserRpgCharacter;
}

const modifier = (score: number) => Math.floor((score - 10) / 2);
const formatModifier = (score: number) => {
  const value = modifier(score);
  return value >= 0 ? `+${value}` : String(value);
};

export const CharacterSheetPreview: React.FC<CharacterSheetPreviewProps> = ({ character }) => (
  <article className="rounded-3xl border border-amber-300/15 bg-black/30 p-5">
    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-200">Character Sheet</p>
    <h3 className="mt-2 text-2xl font-black text-white">{character.name || 'Unnamed Hero'}</h3>
    <p className="mt-1 text-xs font-bold text-gray-500">
      Level {character.level} · {character.raceName || character.raceIndex || 'race'} · {character.className || character.classIndex || 'class'}
    </p>
    <div className="mt-4 grid grid-cols-3 gap-2">
      {Object.entries(character.attributes).map(([name, value]) => (
        <div key={name} className="rounded-2xl border border-white/10 bg-white/[0.035] p-3 text-center">
          <div className="text-[10px] font-black uppercase text-gray-500">{name.slice(0, 3)}</div>
          <div className="mt-1 text-2xl font-black text-white">{value}</div>
          <div className="text-xs font-black text-amber-100">{formatModifier(value)}</div>
        </div>
      ))}
    </div>
    {character.notes && <p className="mt-4 text-sm leading-6 text-gray-400">{character.notes}</p>}
  </article>
);
