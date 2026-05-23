import React, { useEffect, useState } from 'react';
import {
  CURRENT_NSFW_TERMS_VERSION,
  disablePreferredNsfwAccess,
  enablePreferredNsfwAccess,
  getPreferredUserGlobalSettings,
  getUserGlobalSettings,
  updatePreferredUserGlobalSettings,
  type UserGlobalSettings,
} from '../../../services/userProfileService';
import { NsfwAccessModal } from '../../../features/nsfwGate/components/NsfwAccessModal';
import { checkApiHealth } from '../../../shared/services/apiClient';

interface NsfwAccessSettingsProps {
  userId: string;
  onLoginRequest: () => void;
  onRegisterRequest: () => void;
  onSettingsChange?: (settings: UserGlobalSettings) => void;
}

export const NsfwAccessSettings: React.FC<NsfwAccessSettingsProps> = ({
  userId,
  onLoginRequest,
  onRegisterRequest,
  onSettingsChange,
}) => {
  const [settings, setSettings] = useState(() => getUserGlobalSettings(userId));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [backendOnline, setBackendOnline] = useState(false);

  const refresh = async () => {
    const [{ settings: updated, backendAvailable }, health] = await Promise.all([
      getPreferredUserGlobalSettings(userId),
      checkApiHealth(),
    ]);
    setBackendOnline(Boolean(backendAvailable || health?.ok));
    setSettings(updated);
    onSettingsChange?.(updated);
  };

  useEffect(() => {
    void refresh();
  }, [userId]);

  const enabled =
    settings.nsfwAccessEnabled &&
    settings.nsfwTermsAccepted &&
    settings.nsfwTermsVersion === CURRENT_NSFW_TERMS_VERSION;

  const handleDisable = async () => {
    const { settings: updated, backendAvailable } = await disablePreferredNsfwAccess(userId);
    setBackendOnline(backendAvailable);
    setSettings(updated);
    onSettingsChange?.(updated);
  };

  const handleToggleHide = async (checked: boolean) => {
    const { settings: updated, backendAvailable } = await updatePreferredUserGlobalSettings(userId, { hideNsfwFromPortal: checked });
    setBackendOnline(backendAvailable);
    setSettings(updated);
    onSettingsChange?.(updated);
  };

  const handleTogglePrivacy = async (checked: boolean) => {
    const { settings: updated, backendAvailable } = await updatePreferredUserGlobalSettings(userId, { privacyMode: checked });
    setBackendOnline(backendAvailable);
    setSettings(updated);
    onSettingsChange?.(updated);
  };

  return (
    <section className="overflow-hidden rounded-3xl border border-rose-300/15 bg-gradient-to-br from-rose-500/10 via-violet-500/5 to-transparent p-6 shadow-2xl shadow-black/30">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.26em] text-rose-200">Vault NSFW</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-white">Access Settings</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-400">
            Vault NSFW is only available after profile activation, adult confirmation and current terms acceptance.
          </p>
        </div>
        <span className={`w-fit rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.14em] ${
          enabled ? 'border-emerald-300/25 bg-emerald-500/10 text-emerald-100' : 'border-rose-300/25 bg-rose-500/10 text-rose-100'
        }`}>
          {enabled ? 'Enabled' : 'Disabled'}
        </span>
        <span className={`w-fit rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.14em] ${
          backendOnline ? 'border-cyan-300/25 bg-cyan-500/10 text-cyan-100' : 'border-white/10 bg-white/[0.04] text-gray-400'
        }`}>
          Backend: {backendOnline ? 'online' : 'offline'}
        </span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-gray-500">Terms</p>
          <p className="mt-2 text-sm font-bold text-white">{settings.nsfwTermsVersion || 'Not accepted'}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4 sm:col-span-2">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-gray-500">Accepted at</p>
          <p className="mt-2 text-sm font-bold text-white">{settings.nsfwAcceptedAt ? new Date(settings.nsfwAcceptedAt).toLocaleString() : 'Not accepted yet'}</p>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        {enabled ? (
          <button
            type="button"
            onClick={handleDisable}
            className="rounded-2xl border border-rose-300/25 bg-rose-500/10 px-5 py-3 text-sm font-black text-rose-100 transition hover:bg-rose-500/20"
          >
            Disable NSFW Access
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="rounded-2xl bg-gradient-to-r from-rose-700 via-fuchsia-700 to-violet-700 px-5 py-3 text-sm font-black text-white shadow-lg shadow-rose-950/30 transition hover:scale-[1.02]"
          >
            Enable Vault NSFW Access
          </button>
        )}

        <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm font-semibold text-gray-300">
          <input
            type="checkbox"
            checked={Boolean(settings.hideNsfwFromPortal)}
            onChange={(event) => handleToggleHide(event.target.checked)}
            className="h-4 w-4 accent-rose-500"
          />
          Hide NSFW shortcuts from Portal
        </label>

        <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm font-semibold text-gray-300">
          <input
            type="checkbox"
            checked={Boolean(settings.privacyMode)}
            onChange={(event) => handleTogglePrivacy(event.target.checked)}
            className="h-4 w-4 accent-rose-500"
          />
          Privacy Mode
        </label>
      </div>

      <NsfwAccessModal
        isOpen={isModalOpen}
        isLoggedIn
        onClose={() => setIsModalOpen(false)}
        onLoginRequest={onLoginRequest}
        onRegisterRequest={onRegisterRequest}
        onConfirm={async () => {
          const { settings: updated, backendAvailable } = await enablePreferredNsfwAccess(userId);
          setBackendOnline(backendAvailable);
          setSettings(updated);
          onSettingsChange?.(updated);
          setIsModalOpen(false);
        }}
      />
    </section>
  );
};
