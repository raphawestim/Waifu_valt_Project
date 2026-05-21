import React, { useEffect, useMemo, useState } from 'react';
import { ErrorState } from '../../../shared/components/ErrorState';
import { LoadingState } from '../../../shared/components/LoadingState';
import { getEquipment, getEquipmentByIndex } from '../services/dnd5eService';
import type { DndApiReference, DndEquipment } from '../types/rpg.types';
import { DetailsModal, Info } from './SpellbookSection';

export const EquipmentSection: React.FC = () => {
  const [equipment, setEquipment] = useState<DndApiReference[]>([]);
  const [query, setQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<DndEquipment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getEquipment()
      .then((payload) => setEquipment(payload.results))
      .catch(() => setError('Equipment could not be loaded from the D&D 5e API.'))
      .finally(() => setIsLoading(false));
  }, []);

  const visibleEquipment = useMemo(() => equipment.filter((item) => item.name.toLowerCase().includes(query.toLowerCase())).slice(0, 24), [equipment, query]);
  const openItem = (index: string) => getEquipmentByIndex(index).then(setSelectedItem).catch(() => setError('Equipment details could not be loaded.'));

  return (
    <section id="equipment">
      <div className="mb-4">
        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-amber-200">Equipment</p>
        <h2 className="mt-2 text-2xl font-black text-white">Weapons, armor and gear</h2>
      </div>
      <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search equipment..." className="mb-4 h-12 w-full rounded-2xl border border-white/10 bg-[#080812] px-4 text-sm font-bold text-white outline-none" />
      {isLoading && <LoadingState count={4} />}
      {error && <ErrorState message={error} />}
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {visibleEquipment.map((item) => (
          <button key={item.index} onClick={() => openItem(item.index)} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-left transition hover:border-amber-300/25 hover:bg-white/[0.06]">
            <div className="font-black text-white">{item.name}</div>
            <div className="mt-1 text-xs font-bold text-gray-500">Equipment details</div>
          </button>
        ))}
      </div>
      {selectedItem && (
        <DetailsModal title={selectedItem.name} onClose={() => setSelectedItem(null)}>
          <div className="grid gap-3 sm:grid-cols-3">
            <Info label="Category" value={selectedItem.equipment_category?.name || 'N/A'} />
            <Info label="Cost" value={selectedItem.cost ? `${selectedItem.cost.quantity} ${selectedItem.cost.unit}` : 'N/A'} />
            <Info label="Weight" value={selectedItem.weight ? `${selectedItem.weight} lb` : 'N/A'} />
            <Info label="Damage" value={selectedItem.damage?.damage_dice || 'N/A'} />
          </div>
          <p className="mt-4 text-sm leading-7 text-gray-300">{selectedItem.desc?.join('\n') || 'No description available.'}</p>
        </DetailsModal>
      )}
    </section>
  );
};
