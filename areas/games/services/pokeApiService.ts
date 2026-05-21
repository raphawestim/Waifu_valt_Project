import type { PokemonSearchResult } from '../types/games.types';

interface PokeApiPokemonResponse {
  id: number;
  name: string;
  sprites: {
    front_default?: string | null;
    other?: {
      'official-artwork'?: {
        front_default?: string | null;
      };
    };
  };
  types: Array<{ type: { name: string } }>;
  abilities: Array<{ ability: { name: string } }>;
  stats: Array<{ base_stat: number; stat: { name: string } }>;
}

const pokemonSearchCache = new Map<string, PokemonSearchResult[]>();

export async function searchPokemon(query: string): Promise<PokemonSearchResult[]> {
  const slug = query.trim().toLowerCase().replace(/\s+/g, '-');
  if (!slug) return [];
  const cachedResults = pokemonSearchCache.get(slug);
  if (cachedResults) return cachedResults;

  const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${encodeURIComponent(slug)}`);
  if (response.status === 404) return [];
  if (!response.ok) throw new Error('PokeAPI search failed.');

  const pokemon = (await response.json()) as PokeApiPokemonResponse;

  const results: PokemonSearchResult[] = [
    {
      id: pokemon.id,
      name: pokemon.name,
      spriteUrl: pokemon.sprites.other?.['official-artwork']?.front_default || pokemon.sprites.front_default || undefined,
      types: pokemon.types.map((entry) => entry.type.name),
      abilities: pokemon.abilities.map((entry) => entry.ability.name),
      stats: pokemon.stats.slice(0, 6).map((entry) => ({ name: entry.stat.name, value: entry.base_stat })),
      sourceUrl: `https://pokeapi.co/api/v2/pokemon/${pokemon.id}`,
    },
  ];
  pokemonSearchCache.set(slug, results);
  return results;
}

export async function getFeaturedPokemon(): Promise<PokemonSearchResult[]> {
  const names = ['pikachu', 'charizard', 'mewtwo', 'lucario', 'gengar', 'eevee', 'dragonite', 'greninja'];
  const results = await Promise.all(names.map((name) => searchPokemon(name)));
  return results.flat();
}
