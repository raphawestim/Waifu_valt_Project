import React, { useState } from 'react';
import { createUserCampaign, saveCampaignSession, saveUserCampaign } from '../../../shared/storage/userCollectionsService';
import type { CampaignSession, UserCampaign, UserRpgCharacter } from '../types/rpg.types';

interface CampaignCreatorProps {
  userId?: string;
  campaigns: UserCampaign[];
  characters: UserRpgCharacter[];
  onCampaignsChange: (campaigns: UserCampaign[]) => void;
  onLoginRequired: () => void;
}

export const CampaignCreator: React.FC<CampaignCreatorProps> = ({
  userId,
  campaigns,
  characters,
  onCampaignsChange,
  onLoginRequired,
}) => {
  const [draft, setDraft] = useState(() => createUserCampaign(userId || 'guest', ''));
  const [sessionSummary, setSessionSummary] = useState('');

  const saveCampaign = () => {
    if (!userId) {
      onLoginRequired();
      return;
    }
    onCampaignsChange(saveUserCampaign(userId, { ...draft, userId, name: draft.name.trim() || 'Untitled Campaign' }));
    setDraft(createUserCampaign(userId, ''));
  };

  const saveSession = (campaign: UserCampaign) => {
    if (!userId || !sessionSummary.trim()) return;
    const timestamp = new Date().toISOString();
    const session: CampaignSession = {
      id: `session-${Date.now()}`,
      userId,
      campaignId: campaign.id,
      title: `Session ${new Date().toLocaleDateString()}`,
      summary: sessionSummary,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    saveCampaignSession(userId, campaign.id, session);
    setSessionSummary('');
  };

  return (
    <section id="campaigns" className="grid gap-5 xl:grid-cols-[1fr_24rem]">
      <div className="rounded-3xl border border-red-300/15 bg-black/25 p-5">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-red-200">Campaigns</p>
        <h2 className="mt-2 text-2xl font-black text-white">Create a campaign</h2>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="Campaign name" className="h-12 rounded-2xl border border-white/10 bg-[#080812] px-4 text-sm font-bold text-white outline-none" />
          <input value={draft.tone || ''} onChange={(event) => setDraft({ ...draft, tone: event.target.value })} placeholder="Tone: grimdark, heroic..." className="h-12 rounded-2xl border border-white/10 bg-[#080812] px-4 text-sm font-bold text-white outline-none" />
          <input value={draft.world || ''} onChange={(event) => setDraft({ ...draft, world: event.target.value })} placeholder="World / setting" className="h-12 rounded-2xl border border-white/10 bg-[#080812] px-4 text-sm font-bold text-white outline-none md:col-span-2" />
        </div>
        <textarea value={draft.description || ''} onChange={(event) => setDraft({ ...draft, description: event.target.value })} placeholder="Campaign lore, factions, opening situation..." className="mt-4 min-h-28 w-full rounded-2xl border border-white/10 bg-[#080812] p-4 text-sm font-semibold text-white outline-none" />
        <button onClick={saveCampaign} className="mt-4 rounded-2xl bg-red-500/15 px-5 py-3 text-sm font-black text-red-100 hover:bg-red-500/25">Save Campaign</button>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-4">
        <h3 className="text-lg font-black text-white">My Campaigns</h3>
        <p className="mt-1 text-xs text-gray-500">{characters.length} character(s) available to link in future detail pages.</p>
        <textarea value={sessionSummary} onChange={(event) => setSessionSummary(event.target.value)} placeholder="Quick session note..." className="mt-4 min-h-24 w-full rounded-2xl border border-white/10 bg-black/30 p-3 text-sm text-white outline-none" />
        <div className="mt-3 space-y-2">
          {campaigns.length === 0 ? <p className="text-sm text-gray-500">No campaigns yet.</p> : campaigns.map((campaign) => (
            <div key={campaign.id} className="rounded-2xl border border-white/10 bg-black/25 p-3">
              <div className="font-black text-white">{campaign.name}</div>
              <div className="text-xs text-gray-500">{campaign.system} · {campaign.tone || 'tone TBD'}</div>
              <button onClick={() => saveSession(campaign)} className="mt-2 text-xs font-black text-amber-100">Save Session Note</button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
