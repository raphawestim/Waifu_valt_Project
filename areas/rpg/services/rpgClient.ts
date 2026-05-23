import { apiDelete, apiGet, apiPatch, apiPost } from '../../../shared/services/apiClient';
import type { CampaignSession, UserCampaign, UserRpgCharacter } from '../types/rpg.types';

type RpgCharacterPayload = Omit<UserRpgCharacter, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;
type RpgCharacterPatch = Partial<RpgCharacterPayload>;
type CampaignPayload = Omit<UserCampaign, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;
type CampaignPatch = Partial<CampaignPayload>;
type CampaignSessionPayload = Omit<CampaignSession, 'id' | 'userId' | 'campaignId' | 'createdAt' | 'updatedAt'>;
type CampaignSessionPatch = Partial<CampaignSessionPayload>;

function toCharacterPayload(character: UserRpgCharacter): RpgCharacterPayload {
  return {
    name: character.name,
    raceIndex: character.raceIndex,
    raceName: character.raceName,
    classIndex: character.classIndex,
    className: character.className,
    level: character.level,
    background: character.background,
    alignment: character.alignment,
    attributes: character.attributes,
    notes: character.notes || '',
    isFavorite: character.isFavorite,
  };
}

function toCampaignPayload(campaign: UserCampaign): CampaignPayload {
  return {
    name: campaign.name,
    system: campaign.system,
    tone: campaign.tone,
    world: campaign.world,
    description: campaign.description,
    characterIds: campaign.characterIds || [],
    notes: campaign.notes || '',
    isFavorite: campaign.isFavorite,
  };
}

function toSessionPayload(session: CampaignSession): CampaignSessionPayload {
  return {
    title: session.title,
    summary: session.summary || '',
    notes: session.notes || '',
    sessionDate: session.sessionDate,
  };
}

export async function getBackendRpgCharacters(): Promise<UserRpgCharacter[]> {
  const response = await apiGet<{ characters: UserRpgCharacter[] }>('/me/rpg/characters');
  return response.characters || [];
}

export async function createBackendRpgCharacter(payload: UserRpgCharacter): Promise<UserRpgCharacter> {
  const response = await apiPost<{ character: UserRpgCharacter }>('/me/rpg/characters', toCharacterPayload(payload));
  return response.character;
}

export async function updateBackendRpgCharacter(characterId: string, patch: RpgCharacterPatch): Promise<UserRpgCharacter> {
  const response = await apiPatch<{ character: UserRpgCharacter }>(`/me/rpg/characters/${characterId}`, patch);
  return response.character;
}

export async function deleteBackendRpgCharacter(characterId: string): Promise<void> {
  await apiDelete(`/me/rpg/characters/${characterId}`);
}

export async function getBackendCampaigns(): Promise<UserCampaign[]> {
  const response = await apiGet<{ campaigns: UserCampaign[] }>('/me/rpg/campaigns');
  return response.campaigns || [];
}

export async function createBackendCampaign(payload: UserCampaign): Promise<UserCampaign> {
  const response = await apiPost<{ campaign: UserCampaign }>('/me/rpg/campaigns', toCampaignPayload(payload));
  return response.campaign;
}

export async function updateBackendCampaign(campaignId: string, patch: CampaignPatch): Promise<UserCampaign> {
  const response = await apiPatch<{ campaign: UserCampaign }>(`/me/rpg/campaigns/${campaignId}`, patch);
  return response.campaign;
}

export async function deleteBackendCampaign(campaignId: string): Promise<void> {
  await apiDelete(`/me/rpg/campaigns/${campaignId}`);
}

export async function getBackendCampaignSessions(campaignId: string): Promise<CampaignSession[]> {
  const response = await apiGet<{ sessions: CampaignSession[] }>(`/me/rpg/campaigns/${campaignId}/sessions`);
  return response.sessions || [];
}

export async function createBackendCampaignSession(campaignId: string, payload: CampaignSession): Promise<CampaignSession> {
  const response = await apiPost<{ session: CampaignSession }>(`/me/rpg/campaigns/${campaignId}/sessions`, toSessionPayload(payload));
  return response.session;
}

export async function updateBackendCampaignSession(
  campaignId: string,
  sessionId: string,
  patch: CampaignSessionPatch,
): Promise<CampaignSession> {
  const response = await apiPatch<{ session: CampaignSession }>(`/me/rpg/campaigns/${campaignId}/sessions/${sessionId}`, patch);
  return response.session;
}

export async function deleteBackendCampaignSession(campaignId: string, sessionId: string): Promise<void> {
  await apiDelete(`/me/rpg/campaigns/${campaignId}/sessions/${sessionId}`);
}
