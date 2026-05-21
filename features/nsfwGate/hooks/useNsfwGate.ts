import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CURRENT_NSFW_TERMS_VERSION,
  enableNsfwAccess,
  getUserGlobalSettings,
  hasNsfwAccess,
  type UserGlobalSettings,
} from '../../../services/userProfileService';

export const NSFW_TERMS_VERSION = CURRENT_NSFW_TERMS_VERSION;

const guestSettings = (): UserGlobalSettings => ({
  userId: 'guest',
  theme: 'dark',
  defaultVault: 'portal',
  nsfwAccessEnabled: false,
  nsfwTermsAccepted: false,
  hideNsfwFromPortal: false,
  privacyMode: false,
});

export function useNsfwGate(userId?: string) {
  const [isGateOpen, setIsGateOpen] = useState(false);
  const [settings, setSettings] = useState<UserGlobalSettings>(() =>
    userId ? getUserGlobalSettings(userId) : guestSettings(),
  );

  const refresh = useCallback(() => {
    setSettings(userId ? getUserGlobalSettings(userId) : guestSettings());
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const hasAccess = Boolean(userId && hasNsfwAccess(userId));

  const openGate = useCallback(() => setIsGateOpen(true), []);
  const closeGate = useCallback(() => setIsGateOpen(false), []);

  const acceptTerms = useCallback(() => {
    if (!userId) {
      setIsGateOpen(false);
      return guestSettings();
    }
    const updated = enableNsfwAccess(userId);
    setSettings(updated);
    setIsGateOpen(false);
    return updated;
  }, [userId]);

  return useMemo(
    () => ({
      isGateOpen,
      settings,
      hasAccess,
      hasAcceptedTerms: hasAccess,
      openGate,
      closeGate,
      acceptTerms,
      refresh,
    }),
    [acceptTerms, closeGate, hasAccess, isGateOpen, openGate, refresh, settings],
  );
}
