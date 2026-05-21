import React, { useEffect, useState } from 'react';
import { BackToPortalButton } from '../../../shared/components/BackToPortalButton';
import { ErrorState } from '../../../shared/components/ErrorState';
import {
  getUserCampaigns,
  getUserRpgCharacters,
  type UserCampaign,
  type UserRpgCharacter,
} from '../../../shared/storage/userCollectionsService';
import { AiDungeonMasterPanel } from '../components/AiDungeonMasterPanel';
import { BestiarySection } from '../components/BestiarySection';
import { CampaignCreator } from '../components/CampaignCreator';
import { CharacterBuilder } from '../components/CharacterBuilder';
import { EquipmentSection } from '../components/EquipmentSection';
import { SpellbookSection } from '../components/SpellbookSection';
import { getClasses, getRaces, getRules } from '../services/dnd5eService';
import type { DndApiReference } from '../types/rpg.types';

interface RpgHomeProps {
  isLoggedIn: boolean;
  username?: string;
  userId?: string;
  onBackToPortal: () => void;
  onEnterNsfw: () => void;
  onLoginClick: () => void;
}

export const RpgHome: React.FC<RpgHomeProps> = ({
  isLoggedIn,
  username,
  userId,
  onBackToPortal,
  onEnterNsfw,
  onLoginClick,
}) => {
  const [classes, setClasses] = useState<DndApiReference[]>([]);
  const [races, setRaces] = useState<DndApiReference[]>([]);
  const [rules, setRules] = useState<DndApiReference[]>([]);
  const [characters, setCharacters] = useState<UserRpgCharacter[]>([]);
  const [campaigns, setCampaigns] = useState<UserCampaign[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    setCharacters(userId ? getUserRpgCharacters(userId) : []);
    setCampaigns(userId ? getUserCampaigns(userId) : []);
  }, [userId]);

  useEffect(() => {
    Promise.all([getClasses(), getRaces(), getRules()])
      .then(([classList, raceList, ruleList]) => {
        setClasses(classList.results);
        setRaces(raceList.results);
        setRules(ruleList.results);
      })
      .catch(() => setApiError('D&D 5e API data could not be loaded. Local character and campaign storage still works.'));
  }, []);

  return (
    <main className="min-h-screen overflow-hidden bg-[#05050a] text-white selection:bg-amber-500/30">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_16%_0%,rgba(245,158,11,0.16),transparent_30%),radial-gradient(circle_at_80%_16%,rgba(220,38,38,0.14),transparent_28%),linear-gradient(180deg,#05050a_0%,#130b08_52%,#05050a_100%)]" />
      <div className="relative z-10 mx-auto w-full max-w-[92rem] px-5 py-6 sm:px-8">
        <header className="flex flex-col gap-5 border-b border-white/10 pb-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <BackToPortalButton onClick={onBackToPortal} tone="violet" />
            <h1 className="mt-4 text-5xl font-black leading-none tracking-tight text-white sm:text-6xl">Vault D&D / RPG</h1>
            <p className="mt-3 text-sm font-black uppercase tracking-[0.22em] text-amber-200/80">Characters · Campaigns · Monsters · Spells · AI Dungeon Master</p>
            <p className="mt-4 max-w-3xl text-base leading-8 text-gray-400">
              Create characters, manage campaigns, consult the D&D 5e SRD and prepare local AI-powered RPG sessions.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-bold text-gray-400">
              {isLoggedIn ? `Logged as ${username}` : 'Guest mode'}
            </span>
            {!isLoggedIn && <button onClick={onLoginClick} className="rounded-full border border-amber-300/25 bg-amber-500/10 px-4 py-2 text-xs font-black text-amber-100">Login</button>}
            <button onClick={onEnterNsfw} className="rounded-full border border-rose-300/20 bg-rose-500/10 px-4 py-2 text-xs font-black text-rose-100">NSFW 18+</button>
          </div>
        </header>

        <div className="space-y-10 py-8">
          <section className="grid gap-3 md:grid-cols-5">
            {[
              ['My Characters', '#characters', `${characters.length} saved`],
              ['My Campaigns', '#campaigns', `${campaigns.length} worlds`],
              ['Bestiary', '#bestiary', 'Monsters'],
              ['Spellbook', '#spells', 'Magic'],
              ['Rules', '#rules', `${rules.length || 0} sections`],
            ].map(([label, href, caption]) => (
              <a key={label} href={href} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition hover:-translate-y-0.5 hover:border-amber-300/25 hover:bg-white/[0.06]">
                <div className="text-sm font-black text-white">{label}</div>
                <div className="mt-1 text-xs font-bold text-gray-500">{caption}</div>
              </a>
            ))}
          </section>

          {apiError && <ErrorState message={apiError} />}
          <CharacterBuilder userId={userId} classes={classes} races={races} characters={characters} onCharactersChange={setCharacters} onLoginRequired={onLoginClick} />
          <CampaignCreator userId={userId} campaigns={campaigns} characters={characters} onCampaignsChange={setCampaigns} onLoginRequired={onLoginClick} />
          <BestiarySection />
          <SpellbookSection />
          <EquipmentSection />
          <section id="rules" className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-amber-200">Rules Compendium</p>
            <h2 className="mt-2 text-2xl font-black text-white">D&D 5e SRD rules</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {rules.map((rule) => (
                <a key={rule.index} href={`https://www.dnd5eapi.co${rule.url}`} target="_blank" rel="noreferrer" className="rounded-2xl border border-white/10 bg-black/25 p-4 text-sm font-black text-white hover:border-amber-300/25">
                  {rule.name}
                </a>
              ))}
            </div>
          </section>
          <AiDungeonMasterPanel />
        </div>
      </div>
    </main>
  );
};
