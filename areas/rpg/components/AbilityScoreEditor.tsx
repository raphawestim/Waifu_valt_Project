import React from 'react';
import type { UserRpgCharacter } from '../types/rpg.types';

interface AbilityScoreEditorProps {
  attributes: UserRpgCharacter['attributes'];
  onChange: (attributes: UserRpgCharacter['attributes']) => void;
}

const abilities = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'] as const;

export const AbilityScoreEditor: React.FC<AbilityScoreEditorProps> = ({ attributes, onChange }) => (
  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
    {abilities.map((ability) => (
      <label key={ability} className="rounded-2xl border border-white/10 bg-white/[0.035] p-3">
        <span className="block text-[10px] font-black uppercase tracking-[0.16em] text-gray-500">{ability.slice(0, 3)}</span>
        <input
          type="number"
          min={1}
          max={30}
          value={attributes[ability]}
          onChange={(event) => onChange({ ...attributes, [ability]: Number(event.target.value) })}
          className="mt-2 h-10 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm font-black text-white outline-none"
        />
      </label>
    ))}
  </div>
);
