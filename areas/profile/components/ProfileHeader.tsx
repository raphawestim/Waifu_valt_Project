import React from 'react';
import type { UserProfile } from '../../../services/userProfileService';
import { BackToPortalButton } from '../../../shared/components/BackToPortalButton';

interface ProfileHeaderProps {
  profile: UserProfile;
  onBackToPortal: () => void;
  onLogout: () => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ profile, onBackToPortal, onLogout }) => (
  <header className="flex flex-col gap-6 border-b border-white/10 pb-8 lg:flex-row lg:items-end lg:justify-between">
    <div>
      <BackToPortalButton onClick={onBackToPortal} />
      <div className="mt-7 flex items-center gap-4">
        <img
          src={profile.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}`}
          className="h-20 w-20 rounded-3xl border border-violet-300/20 bg-violet-950/40"
          alt=""
        />
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-violet-200">Global Profile</p>
          <h1 className="mt-2 text-5xl font-black tracking-tight text-white">{profile.displayName || profile.username}</h1>
          <p className="mt-2 text-sm text-gray-400">Logged as {profile.username}</p>
        </div>
      </div>
    </div>
    <button
      type="button"
      onClick={onLogout}
      className="w-fit rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-gray-300 transition hover:bg-white/10 hover:text-white"
    >
      Logout
    </button>
  </header>
);
