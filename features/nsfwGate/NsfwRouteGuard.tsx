import React, { useEffect, useState } from 'react';
import { CURRENT_NSFW_TERMS_VERSION, getUserGlobalSettings } from '../../services/userProfileService';
import { NsfwAccessModal } from './components/NsfwAccessModal';

interface NsfwRouteGuardProps {
  userId?: string;
  isAuthenticated: boolean;
  children: React.ReactNode;
  onLoginRequest: () => void;
  onRegisterRequest: () => void;
  onProfileSettings: () => void;
}

export const NsfwRouteGuard: React.FC<NsfwRouteGuardProps> = ({
  userId,
  isAuthenticated,
  children,
  onLoginRequest,
  onRegisterRequest,
  onProfileSettings,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const settings = userId ? getUserGlobalSettings(userId) : null;
  const canAccess = Boolean(
    isAuthenticated &&
      settings?.nsfwAccessEnabled &&
      settings.nsfwTermsAccepted &&
      settings.nsfwTermsVersion === CURRENT_NSFW_TERMS_VERSION,
  );

  useEffect(() => {
    if (!canAccess) setIsOpen(true);
  }, [canAccess]);

  if (canAccess) return <>{children}</>;

  return (
    <NsfwAccessModal
      isOpen={isOpen}
      isLoggedIn={isAuthenticated}
      onClose={() => setIsOpen(false)}
      onLoginRequest={onLoginRequest}
      onRegisterRequest={onRegisterRequest}
      onProfileSettings={onProfileSettings}
      onConfirm={onProfileSettings}
    />
  );
};
