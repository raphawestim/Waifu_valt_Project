import React, { useEffect, useMemo, useState } from 'react';
import type { User, WaifuImage } from '../../../types';
import {
  getPokemonGroups,
} from '../../../shared/storage/userCollectionsService';
import { getUserGames, loadUserGames, saveUserGameHybrid } from '../../games/services/userGamesService';
import { getUserDecks, loadUserDecks, saveUserDeckHybrid } from '../../tcg/services/userDecksService';
import {
  getAllCampaignSessions,
  getUserCampaigns,
  getUserRpgCharacters,
  loadUserRpgData,
  saveUserCampaignHybrid,
  saveUserRpgCharacterHybrid,
} from '../../rpg/services/userRpgService';
import { getUserMangaLibrary, loadUserMangaLibrary, saveUserMangaItemHybrid } from '../../manga/services/userMangaService';
import {
  checkApiHealth,
} from '../../../shared/services/apiClient';
import {
  getGlobalFavorites,
  getPreferredCurrentUserProfile,
  getPreferredGlobalFavorites,
  getPreferredUserGlobalSettings,
  getUserGlobalSettings,
  profileFromAuthUser,
  removePreferredGlobalFavorite,
  type GlobalFavoriteItem,
  type UserProfile,
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
  accountMode?: 'backend' | 'local' | null;
}

export const UserProfilePage: React.FC<UserProfilePageProps> = ({
  user,
  favorites,
  onBackToPortal,
  onLogin,
  onRegister,
  onLogout,
  onSettingsChange,
  accountMode,
}) => {
  const fallbackProfile = useMemo(() => (user ? profileFromAuthUser(user) : null), [user]);
  const [preferredProfile, setPreferredProfile] = useState<UserProfile | null>(null);
  const [backendOnline, setBackendOnline] = useState(false);
  const [backendStatusOnline, setBackendStatusOnline] = useState(false);
  const [backendFavorites, setBackendFavorites] = useState<GlobalFavoriteItem[] | null>(null);
  const [backendSettings, setBackendSettings] = useState<UserGlobalSettings | null>(null);
  const [backendGames, setBackendGames] = useState<ReturnType<typeof getUserGames> | null>(null);
  const [backendDecks, setBackendDecks] = useState<ReturnType<typeof getUserDecks> | null>(null);
  const [backendManga, setBackendManga] = useState<ReturnType<typeof getUserMangaLibrary> | null>(null);
  const [backendRpgCharacters, setBackendRpgCharacters] = useState<ReturnType<typeof getUserRpgCharacters> | null>(null);
  const [backendRpgCampaigns, setBackendRpgCampaigns] = useState<ReturnType<typeof getUserCampaigns> | null>(null);
  const [backendRpgSessions, setBackendRpgSessions] = useState<ReturnType<typeof getAllCampaignSessions> | null>(null);
  const [settingsVersion, setSettingsVersion] = useState(0);
  const [favoritesVersion, setFavoritesVersion] = useState(0);
  const profile = preferredProfile || fallbackProfile;

  useEffect(() => {
    let cancelled = false;
    checkApiHealth().then((health) => {
      if (!cancelled) setBackendStatusOnline(Boolean(health?.ok));
    });
    return () => {
      cancelled = true;
    };
  }, [fallbackProfile?.id]);

  useEffect(() => {
    let cancelled = false;
    setPreferredProfile(null);
    setBackendFavorites(null);
    setBackendSettings(null);
    if (!fallbackProfile?.id) {
      setBackendOnline(false);
      return;
    }

    const loadBackendProfileState = async () => {
      const [profileResult, settingsResult, favoritesResult] = await Promise.all([
        getPreferredCurrentUserProfile(),
        getPreferredUserGlobalSettings(fallbackProfile.id),
        getPreferredGlobalFavorites(fallbackProfile.id),
      ]);
      if (cancelled) return;
      setPreferredProfile(profileResult.profile);
      setBackendSettings(settingsResult.settings);
      setBackendFavorites(favoritesResult.favorites);
      setBackendOnline(profileResult.backendAvailable || settingsResult.backendAvailable || favoritesResult.backendAvailable);
    };

    void loadBackendProfileState();
    return () => {
      cancelled = true;
    };
  }, [fallbackProfile?.id]);

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
  const games = backendGames || getUserGames(userId);
  const decks = backendDecks || getUserDecks(userId);
  const pokemonGroups = getPokemonGroups(userId);
  const manga = backendManga || getUserMangaLibrary(userId);
  const characters = backendRpgCharacters || getUserRpgCharacters(userId);
  const campaigns = backendRpgCampaigns || getUserCampaigns(userId);
  const sessions = backendRpgSessions || getAllCampaignSessions(userId);
  const globalFavorites = backendFavorites || getGlobalFavorites(userId);
  const settings = backendSettings || getUserGlobalSettings(userId);
  const privacy = Boolean(settings.privacyMode);

  const handleSettingsChange = (updated: UserGlobalSettings) => {
    setBackendSettings(updated);
    setSettingsVersion((version) => version + 1);
    onSettingsChange?.(updated);
  };

  useEffect(() => {
    let cancelled = false;
    Promise.all([loadUserGames(userId), loadUserDecks(userId), loadUserMangaLibrary(userId), loadUserRpgData(userId)]).then(([gamesResult, decksResult, mangaResult, rpgResult]) => {
      if (cancelled) return;
      setBackendGames(gamesResult.games);
      setBackendDecks(decksResult.decks);
      setBackendManga(mangaResult.items);
      setBackendRpgCharacters(rpgResult.characters);
      setBackendRpgCampaigns(rpgResult.campaigns);
      setBackendRpgSessions(rpgResult.sessions);
      setBackendOnline((online) =>
        online ||
        gamesResult.storage === 'backend' ||
        decksResult.storage === 'backend' ||
        mangaResult.storage === 'backend' ||
        rpgResult.storage === 'backend',
      );
    });
    return () => {
      cancelled = true;
    };
  }, [userId, favoritesVersion]);

  const handleRemoveFavorite = async (favoriteId: string) => {
    const favorite = globalFavorites.find((item) => item.id === favoriteId);
    if (favorite?.vault === 'games' && favorite.externalId) {
      const game = games.find((item) => item.source === favorite.source && item.externalId === favorite.externalId);
      if (game) await saveUserGameHybrid(userId, { ...game, isFavorite: false });
    }
    if (favorite?.vault === 'tcg' && favorite.type === 'deck' && favorite.externalId) {
      const deck = decks.find((item) => item.id === favorite.externalId);
      if (deck) await saveUserDeckHybrid(userId, { ...deck, isFavorite: false });
    }
    if (favorite?.vault === 'rpg' && favorite.type === 'character' && favorite.externalId) {
      const character = characters.find((item) => item.id === favorite.externalId);
      if (character) await saveUserRpgCharacterHybrid(userId, { ...character, isFavorite: false });
    }
    if (favorite?.vault === 'rpg' && favorite.type === 'campaign' && favorite.externalId) {
      const campaign = campaigns.find((item) => item.id === favorite.externalId);
      if (campaign) await saveUserCampaignHybrid(userId, { ...campaign, isFavorite: false });
    }
    if (favorite?.vault === 'manga' && favorite.externalId) {
      const item = manga.find((entry) => entry.source === favorite.source && entry.externalId === favorite.externalId);
      if (item) await saveUserMangaItemHybrid(userId, { ...item, isFavorite: false });
    }
    const { favorites: updatedFavorites, backendAvailable } = await removePreferredGlobalFavorite(userId, favoriteId);
    setBackendFavorites(updatedFavorites);
    setBackendOnline(backendAvailable || backendOnline);
    setFavoritesVersion((version) => version + 1);
  };

  const summaries = [
    {
      title: 'Vault Games',
      accent: 'border-cyan-300/20 from-cyan-500/12 via-blue-500/5 to-transparent',
      metrics: [
        { label: 'Saved', value: games.length },
        { label: 'Wishlist', value: games.filter((game) => game.personalStatus === 'wishlist').length },
        { label: 'Playing', value: games.filter((game) => game.personalStatus === 'playing').length },
        { label: 'Finished', value: games.filter((game) => game.personalStatus === 'finished').length },
        { label: 'Completed', value: games.filter((game) => game.personalStatus === 'completed').length },
        { label: 'Favorites', value: games.filter((game) => game.isFavorite).length },
        { label: 'Platinum', value: games.filter((game) => game.personalStatus === 'platinum').length },
      ],
    },
    {
      title: 'Vault TCG',
      accent: 'border-amber-300/20 from-amber-500/12 via-violet-500/5 to-transparent',
      metrics: [
        { label: 'Decks', value: decks.length },
        { label: 'Favorite Decks', value: decks.filter((deck) => deck.isFavorite).length },
        { label: 'Cards', value: decks.reduce((total, deck) => total + deck.cards.reduce((sum, card) => sum + card.quantity, 0), 0) },
        { label: 'Card Favs', value: globalFavorites.filter((item) => item.vault === 'tcg' && item.type === 'card').length },
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
        { label: 'Paused', value: manga.filter((item) => item.status === 'paused').length },
        { label: 'Dropped', value: manga.filter((item) => item.status === 'dropped').length },
      ],
    },
    {
      title: 'Vault D&D / RPG',
      accent: 'border-red-300/20 from-red-500/12 via-amber-500/5 to-transparent',
      metrics: [
        { label: 'Characters', value: characters.length },
        { label: 'Favorite Heroes', value: characters.filter((character) => character.isFavorite).length },
        { label: 'Campaigns', value: campaigns.length },
        { label: 'Favorite Worlds', value: campaigns.filter((campaign) => campaign.isFavorite).length },
        { label: 'Sessions', value: sessions.length },
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
    <main className="min-h-screen bg-[#05050a] text-white" data-settings-version={settingsVersion} data-favorites-version={favoritesVersion}>
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(124,58,237,0.18),transparent_34%),radial-gradient(circle_at_82%_16%,rgba(6,182,212,0.1),transparent_28%),linear-gradient(180deg,#05050a_0%,#0b0713_58%,#05050a_100%)]" />
      <section className="relative z-10 mx-auto max-w-[92rem] px-5 py-8 sm:px-8">
        <ProfileHeader profile={profile} accountMode={accountMode || user.authMode || (backendOnline ? 'backend' : 'local')} onBackToPortal={onBackToPortal} onLogout={onLogout} />

        <div className="mt-8 space-y-8">
          {(accountMode || user.authMode) === 'local' && (
            <div className="rounded-3xl border border-amber-300/20 bg-amber-500/10 p-5 text-sm font-semibold leading-6 text-amber-50">
              You are using a local profile. Data is stored only on this device and may not sync with the backend.
            </div>
          )}
          <ProfileStats
            items={[
              { label: 'Games Saved', value: games.length },
              { label: 'Decks', value: decks.length },
              { label: 'Manga Library', value: manga.length },
              { label: 'Global Favorites', value: globalFavorites.length },
              { label: 'Backend Status', value: backendStatusOnline ? 'Online' : 'Offline' },
              { label: 'Account Mode', value: (accountMode || user.authMode || (backendOnline ? 'backend' : 'local')) === 'local' ? 'Local Profile' : 'Backend Account' },
            ]}
          />
          <ProfileVaultSummary summaries={summaries} />
          <NsfwAccessSettings
            userId={userId}
            onLoginRequest={onLogin}
            onRegisterRequest={onRegister}
            onSettingsChange={handleSettingsChange}
          />
          <GlobalFavoritesPanel favorites={globalFavorites} onRemoveFavorite={handleRemoveFavorite} />
        </div>
      </section>
    </main>
  );
};
