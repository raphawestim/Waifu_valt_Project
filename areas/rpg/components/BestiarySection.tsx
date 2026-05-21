import React, { useEffect, useMemo, useState } from 'react';
import { ErrorState } from '../../../shared/components/ErrorState';
import { LoadingState } from '../../../shared/components/LoadingState';
import { getMonsterByIndex, getMonsters } from '../services/dnd5eService';
import type { DndApiReference, DndMonster } from '../types/rpg.types';
import { DetailsModal, Info } from './SpellbookSection';

export const BestiarySection: React.FC = () => {
  const [monsters, setMonsters] = useState<DndApiReference[]>([]);
  const [query, setQuery] = useState('');
  const [selectedMonster, setSelectedMonster] = useState<DndMonster | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getMonsters()
      .then((payload) => setMonsters(payload.results))
      .catch(() => setError('Bestiary could not be loaded from the D&D 5e API.'))
      .finally(() => setIsLoading(false));
  }, []);

  const visibleMonsters = useMemo(() => monsters.filter((monster) => monster.name.toLowerCase().includes(query.toLowerCase())).slice(0, 24), [monsters, query]);
  const openMonster = (index: string) => getMonsterByIndex(index).then(setSelectedMonster).catch(() => setError('Monster details could not be loaded.'));

  return (
    <section id="bestiary">
      <div className="mb-4">
        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-red-200">Bestiary</p>
        <h2 className="mt-2 text-2xl font-black text-white">Monsters and encounters</h2>
      </div>
      <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search monsters..." className="mb-4 h-12 w-full rounded-2xl border border-white/10 bg-[#080812] px-4 text-sm font-bold text-white outline-none" />
      {isLoading && <LoadingState count={4} />}
      {error && <ErrorState message={error} />}
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {visibleMonsters.map((monster) => (
          <button key={monster.index} onClick={() => openMonster(monster.index)} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-left transition hover:border-red-300/25 hover:bg-white/[0.06]">
            <div className="font-black text-white">{monster.name}</div>
            <div className="mt-1 text-xs font-bold text-gray-500">Monster details</div>
          </button>
        ))}
      </div>
      {selectedMonster && (
        <DetailsModal title={selectedMonster.name} onClose={() => setSelectedMonster(null)}>
          <div className="grid gap-3 sm:grid-cols-3">
            <Info label="Type" value={[selectedMonster.size, selectedMonster.type].filter(Boolean).join(' ') || 'N/A'} />
            <Info label="HP" value={String(selectedMonster.hit_points || 'N/A')} />
            <Info label="CR" value={String(selectedMonster.challenge_rating ?? 'N/A')} />
            <Info label="STR" value={String(selectedMonster.strength || 'N/A')} />
            <Info label="DEX" value={String(selectedMonster.dexterity || 'N/A')} />
            <Info label="CON" value={String(selectedMonster.constitution || 'N/A')} />
          </div>
          <div className="mt-4 space-y-3">
            {(selectedMonster.special_abilities || []).slice(0, 4).map((ability) => <p key={ability.name} className="text-sm leading-6 text-gray-300"><strong>{ability.name}.</strong> {ability.desc}</p>)}
          </div>
        </DetailsModal>
      )}
    </section>
  );
};
