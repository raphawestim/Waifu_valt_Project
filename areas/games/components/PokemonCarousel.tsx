import React, { useEffect, useState } from 'react';
import { ErrorState } from '../../../shared/components/ErrorState';
import { LoadingState } from '../../../shared/components/LoadingState';
import { SectionHeader } from '../../../shared/components/SectionHeader';
import { addPokemonToGroup, type PokemonGroup } from '../../../shared/storage/userCollectionsService';
import { getFeaturedPokemon } from '../services/pokeApiService';
import type { PokemonSearchResult } from '../types/games.types';

interface PokemonCarouselProps {
  userId?: string;
  groups: PokemonGroup[];
  onGroupsChange: (groups: PokemonGroup[]) => void;
  onLoginRequired: () => void;
}

export const PokemonCarousel: React.FC<PokemonCarouselProps> = ({ userId, groups, onGroupsChange, onLoginRequired }) => {
  const [pokemon, setPokemon] = useState<PokemonSearchResult[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);
    getFeaturedPokemon()
      .then((results) => {
        if (!isCancelled) setPokemon(results);
      })
      .catch(() => {
        if (!isCancelled) setError('PokeAPI data could not be loaded right now.');
      })
      .finally(() => {
        if (!isCancelled) setIsLoading(false);
      });
    return () => {
      isCancelled = true;
    };
  }, []);

  const handleAddToGroup = (item: PokemonSearchResult) => {
    if (!userId) {
      onLoginRequired();
      return;
    }
    onGroupsChange(addPokemonToGroup(userId, item, groups[0]?.id));
  };

  const handleFavorite = (item: PokemonSearchResult) => {
    if (!userId) {
      onLoginRequired();
      return;
    }
    setFavoriteIds((current) => (current.includes(item.id) ? current.filter((id) => id !== item.id) : [...current, item.id]));
  };

  return (
    <section>
      <SectionHeader
        eyebrow="Pokemon"
        title="Build teams and groups"
        description="Featured PokeAPI creatures with artwork, types, abilities and quick group actions."
        tone="cyan"
      />
      {isLoading && <LoadingState count={4} />}
      {error && <ErrorState message={error} />}
      {!isLoading && !error && (
        <div className="flex gap-4 overflow-x-auto pb-3 no-scrollbar">
          {pokemon.map((item) => (
            <article key={item.id} className="w-60 shrink-0 rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-xl shadow-black/25">
              <div className="flex h-44 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/10 to-violet-500/10">
                {item.spriteUrl && <img src={item.spriteUrl} alt={item.name} className="h-40 w-40 object-contain" loading="lazy" />}
              </div>
              <h3 className="mt-4 text-lg font-black capitalize text-white">{item.name}</h3>
              <p className="mt-1 text-xs font-bold capitalize text-cyan-100">{item.types.join(' / ')}</p>
              <p className="mt-2 text-xs leading-5 text-gray-400">Abilities: {item.abilities.slice(0, 2).join(', ')}</p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button onClick={() => handleAddToGroup(item)} className="rounded-xl bg-cyan-500/15 px-3 py-2 text-xs font-black text-cyan-100 hover:bg-cyan-500/25">
                  Add to Group
                </button>
                <button onClick={() => handleFavorite(item)} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-black text-gray-200 hover:bg-white/10">
                  {favoriteIds.includes(item.id) ? 'Favorited' : 'Favorite'}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};
