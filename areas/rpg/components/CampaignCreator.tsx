import React, { useMemo, useState } from 'react';
import {
  createCampaignSessionHybrid,
  createUserCampaign,
  deleteUserCampaignHybrid,
  getAllCampaignSessions,
  getCampaignSessions,
  getUserCampaigns,
  saveUserCampaignHybrid,
  toggleCampaignFavoriteHybrid,
} from '../services/userRpgService';
import type { UserCampaign, UserRpgCharacter } from '../types/rpg.types';

interface CampaignCreatorProps {
  userId?: string;
  campaigns: UserCampaign[];
  characters: UserRpgCharacter[];
  onCampaignsChange: (campaigns: UserCampaign[]) => void;
  onLoginRequired: () => void;
  onSessionsChange?: () => void;
  onStorageWarning?: (message: string | null) => void;
}

export const CampaignCreator: React.FC<CampaignCreatorProps> = ({
  userId,
  campaigns,
  characters,
  onCampaignsChange,
  onLoginRequired,
  onSessionsChange,
  onStorageWarning,
}) => {
  const [draft, setDraft] = useState(() => createUserCampaign(userId || 'guest'));
  const [sessionTitle, setSessionTitle] = useState('');
  const [sessionSummary, setSessionSummary] = useState('');

  const sessionCount = useMemo(() => (userId ? getAllCampaignSessions(userId).length : 0), [userId, campaigns, sessionSummary]);

  const saveCampaign = async () => {
    if (!userId) {
      onLoginRequired();
      return;
    }
    const result = await saveUserCampaignHybrid(userId, { ...draft, userId, name: draft.name.trim() || 'Untitled Campaign' });
    onStorageWarning?.(result.warning || null);
    onCampaignsChange(getUserCampaigns(userId));
    setDraft(createUserCampaign(userId));
  };

  const saveSession = async (campaign: UserCampaign) => {
    if (!userId) {
      onLoginRequired();
      return;
    }
    if (!sessionSummary.trim() && !sessionTitle.trim()) return;
    const result = await createCampaignSessionHybrid(userId, campaign.id, {
      title: sessionTitle.trim() || `Session ${getCampaignSessions(userId, campaign.id).length + 1}`,
      summary: sessionSummary,
      notes: sessionSummary,
      sessionDate: new Date().toISOString().slice(0, 10),
    });
    onStorageWarning?.(result.warning || null);
    setSessionTitle('');
    setSessionSummary('');
    onSessionsChange?.();
  };

  const toggleFavorite = async (campaignId: string) => {
    if (!userId) return;
    const result = await toggleCampaignFavoriteHybrid(userId, campaignId);
    onStorageWarning?.(result.warning || null);
    onCampaignsChange(getUserCampaigns(userId));
  };

  const removeCampaign = async (campaignId: string) => {
    if (!userId) return;
    const result = await deleteUserCampaignHybrid(userId, campaignId);
    onStorageWarning?.(result.warning || null);
    onCampaignsChange(getUserCampaigns(userId));
  };

  return (
    <section id="campaigns" className="grid gap-5 xl:grid-cols-[1fr_24rem]">
      <div className="rounded-3xl border border-red-300/15 bg-black/25 p-5">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-red-200">Campaigns</p>
        <h2 className="mt-2 text-2xl font-black text-white">Create a campaign</h2>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="Campaign name" className="h-12 rounded-2xl border border-white/10 bg-[#080812] px-4 text-sm font-bold text-white outline-none" />
          <select value={draft.system} onChange={(event) => setDraft({ ...draft, system: event.target.value as UserCampaign['system'] })} className="h-12 rounded-2xl border border-white/10 bg-[#080812] px-4 text-sm font-bold text-white outline-none">
            <option value="dnd5e">D&D 5e</option>
            <option value="custom">Custom</option>
          </select>
          <input value={draft.tone || ''} onChange={(event) => setDraft({ ...draft, tone: event.target.value })} placeholder="Tone: grimdark, heroic..." className="h-12 rounded-2xl border border-white/10 bg-[#080812] px-4 text-sm font-bold text-white outline-none" />
          <input value={draft.world || ''} onChange={(event) => setDraft({ ...draft, world: event.target.value })} placeholder="World / setting" className="h-12 rounded-2xl border border-white/10 bg-[#080812] px-4 text-sm font-bold text-white outline-none" />
        </div>
        <textarea value={draft.description || ''} onChange={(event) => setDraft({ ...draft, description: event.target.value })} placeholder="Campaign lore, factions, opening situation..." className="mt-4 min-h-28 w-full rounded-2xl border border-white/10 bg-[#080812] p-4 text-sm font-semibold text-white outline-none" />
        <textarea value={draft.notes || ''} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} placeholder="Private DM notes..." className="mt-4 min-h-24 w-full rounded-2xl border border-white/10 bg-[#080812] p-4 text-sm font-semibold text-white outline-none" />
        <button onClick={saveCampaign} className="mt-4 rounded-2xl bg-red-500/15 px-5 py-3 text-sm font-black text-red-100 hover:bg-red-500/25">Save Campaign</button>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-4">
        <h3 className="text-lg font-black text-white">My Campaigns</h3>
        <p className="mt-1 text-xs text-gray-500">{characters.length} character(s) available. {sessionCount} saved session(s).</p>
        <input value={sessionTitle} onChange={(event) => setSessionTitle(event.target.value)} placeholder="Session title" className="mt-4 h-11 w-full rounded-2xl border border-white/10 bg-black/30 px-3 text-sm text-white outline-none" />
        <textarea value={sessionSummary} onChange={(event) => setSessionSummary(event.target.value)} placeholder="Quick session note..." className="mt-3 min-h-24 w-full rounded-2xl border border-white/10 bg-black/30 p-3 text-sm text-white outline-none" />
        <div className="mt-3 space-y-2">
          {campaigns.length === 0 ? <p className="text-sm text-gray-500">No campaigns yet.</p> : campaigns.map((campaign) => {
            const sessions = userId ? getCampaignSessions(userId, campaign.id) : [];
            return (
              <div key={campaign.id} className="rounded-2xl border border-white/10 bg-black/25 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-black text-white">{campaign.name}</div>
                    <div className="text-xs text-gray-500">{campaign.system} · {campaign.tone || 'tone TBD'} · {sessions.length} sessions</div>
                  </div>
                  <span className={`rounded-full px-2 py-1 text-[10px] font-black ${campaign.isFavorite ? 'bg-red-500/20 text-red-100' : 'bg-white/5 text-gray-500'}`}>
                    {campaign.isFavorite ? 'Fav' : 'Saved'}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <button onClick={() => saveSession(campaign)} className="rounded-xl border border-amber-300/20 bg-amber-500/10 px-2 py-2 text-xs font-black text-amber-100">Save Note</button>
                  <button onClick={() => toggleFavorite(campaign.id)} className="rounded-xl border border-red-300/20 bg-red-500/10 px-2 py-2 text-xs font-black text-red-100">{campaign.isFavorite ? 'Unfav' : 'Favorite'}</button>
                  <button onClick={() => removeCampaign(campaign.id)} className="rounded-xl border border-rose-300/15 bg-rose-500/10 px-2 py-2 text-xs font-black text-rose-100">Delete</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
