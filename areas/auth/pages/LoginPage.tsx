import React, { useState } from 'react';
import { BackToPortalButton } from '../../../shared/components/BackToPortalButton';
import type { AuthCredentials, AuthOptions } from '../../../context/AuthContext';
import { PasswordInput } from '../components/PasswordInput';

interface LoginPageProps {
  title?: string;
  onBackToPortal: () => void;
  onSubmit: (payload: AuthCredentials, options?: AuthOptions) => Promise<void> | void;
  onRegister: () => void;
  alternateActionLabel?: string;
  mode?: 'login' | 'register';
}

interface AuthFieldErrors {
  password?: string;
  confirmPassword?: string;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  title = 'Login',
  onBackToPortal,
  onSubmit,
  onRegister,
  alternateActionLabel = 'Need a profile? Register',
  mode = 'login',
}) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<AuthFieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const primaryLabel = mode === 'register' ? 'Create Account' : 'Login';

  const validateBackendSubmit = () => {
    const nextErrors: AuthFieldErrors = {};

    if (!password) {
      nextErrors.password = 'Password is required.';
    } else if (password.length < 8) {
      nextErrors.password = 'Password must be at least 8 characters.';
    }

    if (mode === 'register') {
      if (!confirmPassword) {
        nextErrors.confirmPassword = 'Please confirm your password.';
      } else if (password !== confirmPassword) {
        nextErrors.confirmPassword = 'Passwords do not match.';
      }
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!username.trim()) return;
    setError('');
    if (!validateBackendSubmit()) return;
    setIsSubmitting(true);
    try {
      await onSubmit({
        username: username.trim(),
        email: email.trim() || undefined,
        password,
        displayName: username.trim(),
      }, { mode: 'backend' });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to authenticate.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLocalMode = async () => {
    if (!username.trim()) {
      setError('Username is required for local mode.');
      return;
    }
    setError('');
    setFieldErrors({});
    setIsSubmitting(true);
    try {
      await onSubmit({ username: username.trim(), displayName: username.trim() }, { mode: 'local' });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to create local profile.');
    } finally {
      setIsSubmitting(false);
    }
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
            Use your backend account for synced profile, NSFW access and global favorites. Local mode is separate and only for offline development.
          </p>

          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            <label className="block">
              <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-gray-400">Username</span>
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                autoComplete="username"
                className="h-14 w-full rounded-2xl border border-white/10 bg-black/35 px-4 text-base font-semibold text-white outline-none transition placeholder:text-gray-600 focus:border-violet-300/60 focus:ring-4 focus:ring-violet-500/15"
                placeholder="VaultKeeper"
              />
            </label>
            {mode === 'register' && (
              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-gray-400">Email, optional</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  className="h-14 w-full rounded-2xl border border-white/10 bg-black/35 px-4 text-base font-semibold text-white outline-none transition placeholder:text-gray-600 focus:border-violet-300/60 focus:ring-4 focus:ring-violet-500/15"
                  placeholder="you@example.com"
                />
              </label>
            )}
            <PasswordInput
              label="Password"
              name="password"
              value={password}
              onChange={(value) => {
                setPassword(value);
                setFieldErrors((current) => ({ ...current, password: undefined, confirmPassword: undefined }));
              }}
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
              placeholder={mode === 'register' ? '8+ characters for backend account' : 'Required for backend login'}
              error={fieldErrors.password}
            />
            {mode === 'register' && (
              <PasswordInput
                label="Confirm Password"
                name="confirmPassword"
                value={confirmPassword}
                onChange={(value) => {
                  setConfirmPassword(value);
                  setFieldErrors((current) => ({ ...current, confirmPassword: undefined }));
                }}
                autoComplete="new-password"
                placeholder="Repeat your password"
                error={fieldErrors.confirmPassword}
              />
            )}
            {error && (
              <div className="rounded-2xl border border-rose-300/20 bg-rose-500/10 p-3 text-sm font-semibold text-rose-100">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={!username.trim() || isSubmitting}
              className="h-14 w-full rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-500 text-sm font-black uppercase tracking-[0.16em] text-white shadow-xl shadow-violet-950/30 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
            >
              {isSubmitting ? 'Entering...' : primaryLabel}
            </button>
          </form>

          <div className="mt-6 rounded-3xl border border-amber-300/15 bg-amber-500/10 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-200">Offline / Local Mode</p>
            <p className="mt-2 text-xs leading-5 text-amber-50/80">
              Use this only for local development. Data will be stored on this device and may not sync with the backend.
            </p>
            <button
              type="button"
              onClick={handleLocalMode}
              disabled={!username.trim() || isSubmitting}
              className="mt-4 rounded-2xl border border-amber-200/20 bg-amber-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-amber-100 transition hover:bg-amber-400/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {mode === 'register' ? 'Create Local Profile' : 'Use Local Profile'}
            </button>
          </div>

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
