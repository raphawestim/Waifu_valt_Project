import React, { useState } from 'react';
import { EmptyState } from '../../../shared/components/EmptyState';
import { SectionHeader } from '../../../shared/components/SectionHeader';
import { createPokemonGroup, deletePokemonGroup, savePokemonGroup, type PokemonGroup } from '../../../shared/storage/userCollectionsService';

interface PokemonGroupsPanelProps {
  userId?: string;
  groups: PokemonGroup[];
  onGroupsChange: (groups: PokemonGroup[]) => void;
  onLoginRequired: () => void;
}

export const PokemonGroupsPanel: React.FC<PokemonGroupsPanelProps> = ({ userId, groups, onGroupsChange, onLoginRequired }) => {
  const [name, setName] = useState('');

  const handleCreate = () => {
    if (!userId) {
      onLoginRequired();
      return;
    }
    const group = createPokemonGroup(userId, name.trim() || 'New Pokemon Group');
    onGroupsChange(savePokemonGroup(userId, group));
    setName('');
  };

  return (
    <section id="pokemon-groups">
      <SectionHeader eyebrow="Pokemon Groups" title="My Pokémon Groups" description="Teams, favorites, competitive groups, regional lists and wishlist collections." tone="cyan" />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Group name..." className="h-11 flex-1 rounded-2xl border border-white/10 bg-[#080812] px-4 text-sm font-semibold text-white outline-none placeholder:text-gray-600" />
        <button onClick={handleCreate} className="rounded-2xl bg-cyan-500/15 px-5 py-3 text-sm font-black text-cyan-100 hover:bg-cyan-500/25">
          Create Group
        </button>
      </div>
      {groups.length === 0 ? (
        <EmptyState message="No Pokémon groups yet. Add a Pokémon from the carousel or create a group." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {groups.map((group) => (
            <article key={group.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-black text-white">{group.name}</h3>
                  <p className="mt-1 text-xs font-bold text-gray-500">{group.pokemon.length} Pokémon</p>
                </div>
                <button onClick={() => userId && onGroupsChange(savePokemonGroup(userId, { ...group, isFavorite: !group.isFavorite }))} className="text-xs font-black text-cyan-100">
                  {group.isFavorite ? 'Favorited' : 'Favorite'}
                </button>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {group.pokemon.slice(0, 8).map((item) => (
                  <span key={item.id} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/25 px-2 py-1 text-xs font-bold capitalize text-gray-300">
                    {item.spriteUrl && <img src={item.spriteUrl} alt="" className="h-6 w-6" />}
                    {item.name}
                  </span>
                ))}
              </div>
              <button onClick={() => userId && onGroupsChange(deletePokemonGroup(userId, group.id))} className="mt-4 text-xs font-bold text-rose-200 hover:text-rose-100">
                Delete
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};
