import React from 'react';
import type { GlobalFavoriteItem } from '../../../services/userProfileService';

interface GlobalFavoritesPanelProps {
  favorites: GlobalFavoriteItem[];
}

export const GlobalFavoritesPanel: React.FC<GlobalFavoritesPanelProps> = ({ favorites }) => (
  <section>
    <div className="mb-5">
      <p className="text-[10px] font-black uppercase tracking-[0.26em] text-fuchsia-200">Global Favorites</p>
      <h2 className="mt-2 text-3xl font-black tracking-tight text-white">Saved across every Vault</h2>
    </div>
    {favorites.length === 0 ? (
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-sm text-gray-400">
        No global favorites yet. Favorited games, cards, manga, RPG items and private media will appear here.
      </div>
    ) : (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {favorites.map((favorite) => (
          <article key={favorite.id} className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.045] shadow-xl shadow-black/20">
            {favorite.thumbnailUrl ? (
              <img src={favorite.thumbnailUrl} alt="" className="h-36 w-full object-cover" />
            ) : (
              <div className="h-36 bg-gradient-to-br from-violet-500/20 via-fuchsia-500/10 to-cyan-500/10" />
            )}
            <div className="p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">
                {favorite.vault} / {favorite.type}
              </p>
              <h3 className="mt-2 line-clamp-2 text-base font-black text-white">{favorite.title}</h3>
            </div>
          </article>
        ))}
      </div>
    )}
  </section>
);
