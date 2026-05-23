import React, { useState } from 'react';
import {
  createUserRpgCharacter,
  deleteUserRpgCharacterHybrid,
  getUserRpgCharacters,
  saveUserRpgCharacterHybrid,
  toggleRpgCharacterFavoriteHybrid,
} from '../services/userRpgService';
import type { DndApiReference, UserRpgCharacter } from '../types/rpg.types';
import { AbilityScoreEditor } from './AbilityScoreEditor';
import { CharacterSheetPreview } from './CharacterSheetPreview';
import { ClassSelector } from './ClassSelector';
import { RaceSelector } from './RaceSelector';

interface CharacterBuilderProps {
  userId?: string;
  classes: DndApiReference[];
  races: DndApiReference[];
  characters: UserRpgCharacter[];
  onCharactersChange: (characters: UserRpgCharacter[]) => void;
  onLoginRequired: () => void;
  onStorageWarning?: (message: string | null) => void;
}

export const CharacterBuilder: React.FC<CharacterBuilderProps> = ({ userId, classes, races, characters, onCharactersChange, onLoginRequired, onStorageWarning }) => {
  const [draft, setDraft] = useState<UserRpgCharacter>(() => createUserRpgCharacter(userId || 'guest'));

  const saveCharacter = async () => {
    if (!userId) {
      onLoginRequired();
      return;
    }
    const result = await saveUserRpgCharacterHybrid(userId, { ...draft, userId, name: draft.name.trim() || 'Unnamed Hero' });
    onStorageWarning?.(result.warning || null);
    onCharactersChange(getUserRpgCharacters(userId));
    setDraft(createUserRpgCharacter(userId));
  };

  const chooseRace = (raceIndex: string) => {
    const race = races.find((item) => item.index === raceIndex);
    setDraft({ ...draft, raceIndex, raceName: race?.name });
  };

  const chooseClass = (classIndex: string) => {
    const classItem = classes.find((item) => item.index === classIndex);
    setDraft({ ...draft, classIndex, className: classItem?.name });
  };

  const toggleFavorite = async (characterId: string) => {
    if (!userId) return;
    const result = await toggleRpgCharacterFavoriteHybrid(userId, characterId);
    onStorageWarning?.(result.warning || null);
    onCharactersChange(getUserRpgCharacters(userId));
  };

  const removeCharacter = async (characterId: string) => {
    if (!userId) return;
    const result = await deleteUserRpgCharacterHybrid(userId, characterId);
    onStorageWarning?.(result.warning || null);
    onCharactersChange(getUserRpgCharacters(userId));
  };

  return (
    <section id="characters" className="grid gap-5 xl:grid-cols-[1fr_24rem]">
      <div className="rounded-3xl border border-amber-300/15 bg-black/25 p-5">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-200">Character Builder</p>
        <h2 className="mt-2 text-2xl font-black text-white">Create a D&D 5e character</h2>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="Character name" className="h-12 rounded-2xl border border-white/10 bg-[#080812] px-4 text-sm font-bold text-white outline-none" />
          <input type="number" min={1} max={20} value={draft.level} onChange={(event) => setDraft({ ...draft, level: Number(event.target.value) })} className="h-12 rounded-2xl border border-white/10 bg-[#080812] px-4 text-sm font-bold text-white outline-none" />
          <RaceSelector races={races} value={draft.raceIndex} onChange={chooseRace} />
          <ClassSelector classes={classes} value={draft.classIndex} onChange={chooseClass} />
          <input value={draft.background || ''} onChange={(event) => setDraft({ ...draft, background: event.target.value })} placeholder="Background" className="h-12 rounded-2xl border border-white/10 bg-[#080812] px-4 text-sm font-bold text-white outline-none" />
          <input value={draft.alignment || ''} onChange={(event) => setDraft({ ...draft, alignment: event.target.value })} placeholder="Alignment" className="h-12 rounded-2xl border border-white/10 bg-[#080812] px-4 text-sm font-bold text-white outline-none" />
        </div>
        <div className="mt-4">
          <AbilityScoreEditor attributes={draft.attributes} onChange={(attributes) => setDraft({ ...draft, attributes })} />
        </div>
        <textarea value={draft.notes || ''} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} placeholder="Notes, proficiencies, equipment ideas..." className="mt-4 min-h-28 w-full rounded-2xl border border-white/10 bg-[#080812] p-4 text-sm font-semibold text-white outline-none" />
        <button onClick={saveCharacter} className="mt-4 rounded-2xl bg-amber-500/15 px-5 py-3 text-sm font-black text-amber-100 hover:bg-amber-500/25">Save Character</button>
      </div>
      <div className="space-y-4">
        <CharacterSheetPreview character={draft} />
        <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-4">
          <h3 className="text-lg font-black text-white">My Characters</h3>
          <div className="mt-3 space-y-2">
            {characters.length === 0 ? <p className="text-sm text-gray-500">No saved characters yet.</p> : characters.map((character) => (
              <div key={character.id} className="rounded-2xl border border-white/10 bg-black/25 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-black text-white">{character.name}</div>
                    <div className="text-xs text-gray-500">Level {character.level} · {character.raceName || character.raceIndex || 'race'} · {character.className || character.classIndex || 'class'}</div>
                  </div>
                  <span className={`rounded-full px-2 py-1 text-[10px] font-black ${character.isFavorite ? 'bg-amber-500/20 text-amber-100' : 'bg-white/5 text-gray-500'}`}>
                    {character.isFavorite ? 'Fav' : 'Saved'}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button onClick={() => toggleFavorite(character.id)} className="rounded-xl border border-amber-300/20 bg-amber-500/10 px-3 py-2 text-xs font-black text-amber-100">
                    {character.isFavorite ? 'Unfavorite' : 'Favorite'}
                  </button>
                  <button onClick={() => removeCharacter(character.id)} className="rounded-xl border border-rose-300/15 bg-rose-500/10 px-3 py-2 text-xs font-black text-rose-100">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
