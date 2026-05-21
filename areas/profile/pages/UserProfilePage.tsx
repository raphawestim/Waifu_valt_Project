import React, { useMemo, useState } from 'react';
import type { User, WaifuImage } from '../../../types';
import {
  getUserCampaigns,
  getUserDecks,
  getUserGames,
  getUserMangaLibrary,
  getUserRpgCharacters,
  getPokemonGroups,
} from '../../../shared/storage/userCollectionsService';
import {
  getGlobalFavorites,
  getUserGlobalSettings,
  profileFromAuthUser,
  type UserGlobalSettings,
} from '../../../services/userProfileService';
import { ProfileHeader } from '../components/ProfileHeader';
import { ProfileStats } from '../components/ProfileStats';
import { ProfileVaultSummary } from '../components/ProfileVaultSummary';
import { NsfwAccessSettings } from '../components/NsfwAccessSettings';
import { GlobalFavoritesPanel } from '../components/GlobalFavoritesPanel';
import { BackToPortalButton } from '../../../shared/components/BackToPortalButton';

interface UserProfilePageProps {
  user: User | null;
  favorites: WaifuImage[];
  onBackToPortal: () => void;
  onLogin: () => void;
  onRegister: () => void;
  onLogout: () => void;
  onSettingsChange?: (settings: UserGlobalSettings) => void;
}

export const UserProfilePage: React.FC<UserProfilePageProps> = ({
  user,
  favorites,
  onBackToPortal,
  onLogin,
  onRegister,
  onLogout,
  onSettingsChange,
}) => {
  const profile = useMemo(() => (user ? profileFromAuthUser(user) : null), [user]);
  const [settingsVersion, setSettingsVersion] = useState(0);

  if (!user || !profile) {
    return (
      <main className="min-h-screen bg-[#05050a] text-white">
        <div className="fixed inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(124,58,237,0.2),transparent_34%),linear-gradient(180deg,#05050a_0%,#0b0713_58%,#05050a_100%)]" />
        <section className="relative z-10 mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-5 py-12">
          <BackToPortalButton onClick={onBackToPortal} />
          <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.045] p-8 shadow-2xl shadow-black/35">
            <p className="text-[10px] font-black uppercase tracking-[0.26em] text-violet-200">Global Profile</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight">Login required</h1>
            <p className="mt-3 text-sm leading-6 text-gray-400">
              Your profile centralizes libraries, favorites, deck data, reading progress and Vault NSFW access settings.
            </p>
            <div className="mt-6 flex gap-3">
              <button onClick={onLogin} className="rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-500 px-5 py-3 text-sm font-black text-white">
                Login
              </button>
              <button onClick={onRegister} className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-gray-200">
                Register
              </button>
            </div>
          </div>
        </section>
      </main>
    );
  }

  const userId = profile.id;
  const games = getUserGames(userId);
  const decks = getUserDecks(userId);
  const pokemonGroups = getPokemonGroups(userId);
  const manga = getUserMangaLibrary(userId);
  const characters = getUserRpgCharacters(userId);
  const campaigns = getUserCampaigns(userId);
  const globalFavorites = getGlobalFavorites(userId);
  const settings = getUserGlobalSettings(userId);
  const privacy = Boolean(settings.privacyMode);

  const handleSettingsChange = (updated: UserGlobalSettings) => {
    setSettingsVersion((version) => version + 1);
    onSettingsChange?.(updated);
  };

  const summaries = [
    {
      title: 'Vault Games',
      accent: 'border-cyan-300/20 from-cyan-500/12 via-blue-500/5 to-transparent',
      metrics: [
        { label: 'Saved', value: games.length },
        { label: 'Playing', value: games.filter((game) => game.personalStatus === 'playing').length },
        { label: 'Finished', value: games.filter((game) => game.personalStatus === 'finished').length },
        { label: 'Platinum', value: games.filter((game) => game.personalStatus === 'platinum').length },
      ],
    },
    {
      title: 'Vault TCG',
      accent: 'border-amber-300/20 from-amber-500/12 via-violet-500/5 to-transparent',
      metrics: [
        { label: 'Decks', value: decks.length },
        { label: 'Favorite Decks', value: decks.filter((deck) => deck.isFavorite).length },
        { label: 'Cards', value: decks.reduce((total, deck) => total + deck.cards.length, 0) },
        { label: 'Pokemon Groups', value: pokemonGroups.length },
      ],
    },
    {
      title: 'Vault Manga',
      accent: 'border-fuchsia-300/20 from-fuchsia-500/12 via-violet-500/5 to-transparent',
      metrics: [
        { label: 'Reading', value: manga.filter((item) => item.status === 'reading').length },
        { label: 'Want Read', value: manga.filter((item) => item.status === 'want_to_read').length },
        { label: 'Completed', value: manga.filter((item) => item.status === 'completed').length },
        { label: 'Favorites', value: manga.filter((item) => item.isFavorite || item.status === 'favorite').length },
      ],
    },
    {
      title: 'Vault D&D / RPG',
      accent: 'border-red-300/20 from-red-500/12 via-amber-500/5 to-transparent',
      metrics: [
        { label: 'Characters', value: characters.length },
        { label: 'Campaigns', value: campaigns.length },
        { label: 'Sessions', value: 0 },
        { label: 'AI', value: 'Planned' },
      ],
    },
    {
      title: 'Vault Forge',
      accent: 'border-emerald-300/20 from-emerald-500/12 via-cyan-500/5 to-transparent',
      metrics: [
        { label: 'Prompts', value: globalFavorites.filter((item) => item.vault === 'forge' && item.type === 'prompt').length },
        { label: 'Workflows', value: 0 },
        { label: 'Models', value: 'Planned' },
        { label: 'ComfyUI', value: 'Planned' },
      ],
    },
    {
      title: 'Vault NSFW',
      accent: 'border-rose-300/20 from-rose-500/12 via-violet-500/5 to-transparent',
      metrics: [
        { label: 'Images', value: privacy ? 'Private' : favorites.filter((item) => item.type !== 'video').length },
        { label: 'Videos', value: privacy ? 'Private' : favorites.filter((item) => item.type === 'video').length },
        { label: 'Access', value: settings.nsfwAccessEnabled ? 'Enabled' : 'Disabled' },
        { label: 'Terms', value: settings.nsfwTermsVersion || '-' },
      ],
    },
  ];

  return (
    <main className="min-h-screen bg-[#05050a] text-white" data-settings-version={settingsVersion}>
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(124,58,237,0.18),transparent_34%),radial-gradient(circle_at_82%_16%,rgba(6,182,212,0.1),transparent_28%),linear-gradient(180deg,#05050a_0%,#0b0713_58%,#05050a_100%)]" />
      <section className="relative z-10 mx-auto max-w-[92rem] px-5 py-8 sm:px-8">
        <ProfileHeader profile={profile} onBackToPortal={onBackToPortal} onLogout={onLogout} />

        <div className="mt-8 space-y-8">
          <ProfileStats
            items={[
              { label: 'Games Saved', value: games.length },
              { label: 'Decks', value: decks.length },
              { label: 'Manga Library', value: manga.length },
              { label: 'Global Favorites', value: globalFavorites.length },
            ]}
          />
          <ProfileVaultSummary summaries={summaries} />
          <NsfwAccessSettings
            userId={userId}
            onLoginRequest={onLogin}
            onRegisterRequest={onRegister}
            onSettingsChange={handleSettingsChange}
          />
          <GlobalFavoritesPanel favorites={globalFavorites} />
        </div>
      </section>
    </main>
  );
};
