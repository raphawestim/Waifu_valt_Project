import React from 'react';
import type { User } from '../../types';

interface AuthMenuProps {
  user: User | null;
  onLogin: () => void;
  onRegister: () => void;
  onProfile: () => void;
  onLogout: () => void;
}

export const AuthMenu: React.FC<AuthMenuProps> = ({ user, onLogin, onRegister, onProfile, onLogout }) => {
  if (!user) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onLogin}
          className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-gray-200 transition hover:border-violet-300/30 hover:bg-violet-500/10 hover:text-white"
        >
          Login
        </button>
        <button
          type="button"
          onClick={onRegister}
          className="rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-white shadow-lg shadow-violet-950/30 transition hover:scale-[1.02]"
        >
          Register
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-2 text-xs font-bold text-gray-300">
        Logged as {user.username}
      </span>
      <span className={`rounded-full border px-3 py-2 text-xs font-black uppercase tracking-[0.12em] ${
        user.authMode === 'local'
          ? 'border-amber-300/20 bg-amber-500/10 text-amber-100'
          : 'border-cyan-300/20 bg-cyan-500/10 text-cyan-100'
      }`}>
        {user.authMode === 'local' ? 'Local Profile' : 'Backend Account'}
      </span>
      <button
        type="button"
        onClick={onProfile}
        className="inline-flex items-center gap-2 rounded-full border border-violet-300/20 bg-violet-500/10 px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-violet-100 transition hover:bg-violet-500/20"
      >
        <img
          src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
          className="h-6 w-6 rounded-full border border-violet-300/30 bg-violet-950/50"
          alt=""
        />
        Profile
      </button>
      <button
        type="button"
        onClick={onLogout}
        className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-bold text-gray-400 transition hover:bg-white/10 hover:text-white"
      >
        Logout
      </button>
    </div>
  );
};
