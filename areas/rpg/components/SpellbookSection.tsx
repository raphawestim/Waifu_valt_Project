import React, { useEffect, useMemo, useState } from 'react';
import { ErrorState } from '../../../shared/components/ErrorState';
import { LoadingState } from '../../../shared/components/LoadingState';
import { getSpellByIndex, getSpells } from '../services/dnd5eService';
import type { DndApiReference, DndSpell } from '../types/rpg.types';

export const SpellbookSection: React.FC = () => {
  const [spells, setSpells] = useState<DndApiReference[]>([]);
  const [query, setQuery] = useState('');
  const [level, setLevel] = useState('all');
  const [selectedSpell, setSelectedSpell] = useState<DndSpell | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getSpells()
      .then((payload) => setSpells(payload.results))
      .catch(() => setError('Spellbook could not be loaded from the D&D 5e API.'))
      .finally(() => setIsLoading(false));
  }, []);

  const visibleSpells = useMemo(() => spells.filter((spell) => spell.name.toLowerCase().includes(query.toLowerCase())).slice(0, 24), [query, spells]);

  const openSpell = (index: string) => {
    getSpellByIndex(index).then(setSelectedSpell).catch(() => setError('Spell details could not be loaded.'));
  };

  return (
    <section id="spells">
      <div className="mb-4">
        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-amber-200">Spellbook</p>
        <h2 className="mt-2 text-2xl font-black text-white">Search D&D 5e spells</h2>
      </div>
      <div className="mb-4 grid gap-3 md:grid-cols-[1fr_10rem]">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search spells..." className="h-12 rounded-2xl border border-white/10 bg-[#080812] px-4 text-sm font-bold text-white outline-none" />
        <select value={level} onChange={(event) => setLevel(event.target.value)} className="h-12 rounded-2xl border border-white/10 bg-[#080812] px-3 text-xs font-bold text-white">
          <option value="all">All Levels</option>
          {Array.from({ length: 10 }).map((_, itemLevel) => <option key={itemLevel} value={itemLevel}>Level {itemLevel}</option>)}
        </select>
      </div>
      {isLoading && <LoadingState count={4} />}
      {error && <ErrorState message={error} />}
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {visibleSpells.map((spell) => (
          <button key={spell.index} onClick={() => openSpell(spell.index)} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-left transition hover:border-amber-300/25 hover:bg-white/[0.06]">
            <div className="font-black text-white">{spell.name}</div>
            <div className="mt-1 text-xs font-bold text-gray-500">Spell details</div>
          </button>
        ))}
      </div>
      {selectedSpell && (
        <DetailsModal title={selectedSpell.name} onClose={() => setSelectedSpell(null)}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Info label="Level" value={String(selectedSpell.level ?? 'N/A')} />
            <Info label="School" value={selectedSpell.school?.name || 'N/A'} />
            <Info label="Casting" value={selectedSpell.casting_time || 'N/A'} />
            <Info label="Range" value={selectedSpell.range || 'N/A'} />
            <Info label="Duration" value={selectedSpell.duration || 'N/A'} />
            <Info label="Components" value={(selectedSpell.components || []).join(', ') || 'N/A'} />
          </div>
          <p className="mt-4 text-sm leading-7 text-gray-300">{selectedSpell.desc?.join('\n') || 'No description available.'}</p>
        </DetailsModal>
      )}
    </section>
  );
};

export const Info: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-3">
    <div className="text-[10px] font-black uppercase tracking-[0.16em] text-gray-500">{label}</div>
    <div className="mt-1 text-sm font-bold text-gray-200">{value}</div>
  </div>
);

export const DetailsModal: React.FC<{ title: string; children: React.ReactNode; onClose: () => void }> = ({ title, children, onClose }) => (
  <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 p-4 backdrop-blur-xl" onClick={onClose}>
    <section className="max-h-[86vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-white/10 bg-[#090911] p-6 text-white" onClick={(event) => event.stopPropagation()}>
      <div className="mb-5 flex items-start justify-between gap-4">
        <h2 className="text-3xl font-black">{title}</h2>
        <button onClick={onClose} className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-black">Close</button>
      </div>
      {children}
    </section>
  </div>
);
