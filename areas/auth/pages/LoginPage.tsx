import React, { useState } from 'react';
import { BackToPortalButton } from '../../../shared/components/BackToPortalButton';

interface LoginPageProps {
  title?: string;
  onBackToPortal: () => void;
  onSubmit: (username: string) => Promise<void> | void;
  onRegister: () => void;
  alternateActionLabel?: string;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  title = 'Login',
  onBackToPortal,
  onSubmit,
  onRegister,
  alternateActionLabel = 'Need a profile? Register',
}) => {
  const [username, setUsername] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!username.trim()) return;
    setIsSubmitting(true);
    await onSubmit(username.trim());
    setIsSubmitting(false);
  };

  return (
    <main className="min-h-screen bg-[#05050a] text-white">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(124,58,237,0.22),transparent_34%),radial-gradient(circle_at_82%_18%,rgba(6,182,212,0.12),transparent_28%),linear-gradient(180deg,#05050a_0%,#0b0713_58%,#05050a_100%)]" />
      <section className="relative z-10 mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center px-5 py-12">
        <BackToPortalButton onClick={onBackToPortal} />
        <div className="mt-8 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.045] p-7 shadow-2xl shadow-black/40 backdrop-blur-xl">
          <p className="text-[10px] font-black uppercase tracking-[0.26em] text-violet-200">The Vault Account</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight">{title}</h1>
          <p className="mt-3 text-sm leading-6 text-gray-400">
            Use a local username for this MVP. The profile storage is structured so it can move to a backend later.
          </p>

          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            <label className="block">
              <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-gray-400">Username</span>
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="h-14 w-full rounded-2xl border border-white/10 bg-black/35 px-4 text-base font-semibold text-white outline-none transition placeholder:text-gray-600 focus:border-violet-300/60 focus:ring-4 focus:ring-violet-500/15"
                placeholder="VaultKeeper"
              />
            </label>
            <button
              type="submit"
              disabled={!username.trim() || isSubmitting}
              className="h-14 w-full rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-500 text-sm font-black uppercase tracking-[0.16em] text-white shadow-xl shadow-violet-950/30 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
            >
              {isSubmitting ? 'Entering...' : title}
            </button>
          </form>

          <button
            type="button"
            onClick={onRegister}
            className="mt-5 text-sm font-bold text-violet-200 transition hover:text-white"
          >
            {alternateActionLabel}
          </button>
        </div>
      </section>
    </main>
  );
};
