import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CURRENT_NSFW_TERMS_VERSION,
  enablePreferredNsfwAccess,
  getPreferredUserGlobalSettings,
  getUserGlobalSettings,
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
  const [isChecking, setIsChecking] = useState(Boolean(userId));
  const [settings, setSettings] = useState<UserGlobalSettings>(() =>
    userId ? getUserGlobalSettings(userId) : guestSettings(),
  );

  const refresh = useCallback(() => {
    if (!userId) {
      setSettings(guestSettings());
      setIsChecking(false);
      return;
    }
    setIsChecking(true);
    void getPreferredUserGlobalSettings(userId).then(({ settings: updated }) => {
      setSettings(updated);
      setIsChecking(false);
    }).catch(() => {
      setSettings(getUserGlobalSettings(userId));
      setIsChecking(false);
    });
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const hasAccess = Boolean(
    userId &&
      settings.nsfwAccessEnabled &&
      settings.nsfwTermsAccepted &&
      settings.nsfwTermsVersion === CURRENT_NSFW_TERMS_VERSION,
  );

  const openGate = useCallback(() => setIsGateOpen(true), []);
  const closeGate = useCallback(() => setIsGateOpen(false), []);

  const acceptTerms = useCallback(() => {
    if (!userId) {
      setIsGateOpen(false);
      return guestSettings();
    }
    void enablePreferredNsfwAccess(userId).then(({ settings: updated }) => {
      setSettings(updated);
    });
    const updated = getUserGlobalSettings(userId);
    setIsGateOpen(false);
    return updated;
  }, [userId]);

  return useMemo(
    () => ({
      isGateOpen,
      isChecking,
      settings,
      hasAccess,
      hasAcceptedTerms: hasAccess,
      openGate,
      closeGate,
      acceptTerms,
      refresh,
    }),
    [acceptTerms, closeGate, hasAccess, isChecking, isGateOpen, openGate, refresh, settings],
  );
}
