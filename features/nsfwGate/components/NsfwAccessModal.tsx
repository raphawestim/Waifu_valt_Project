import React, { useEffect, useState } from 'react';

interface NsfwAccessModalProps {
  isOpen: boolean;
  isLoggedIn: boolean;
  onClose: () => void;
  onLoginRequest: () => void;
  onRegisterRequest?: () => void;
  onProfileSettings?: () => void;
  onConfirm: () => void;
}

export const NsfwAccessModal: React.FC<NsfwAccessModalProps> = ({
  isOpen,
  isLoggedIn,
  onClose,
  onLoginRequest,
  onRegisterRequest,
  onProfileSettings,
  onConfirm,
}) => {
  const [isAdult, setIsAdult] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsAdult(false);
      setAcceptedTerms(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const canEnable = isLoggedIn && isAdult && acceptedTerms;

  const handleLoginRequest = () => {
    onClose();
    onLoginRequest();
  };

  const handleRegisterRequest = () => {
    onClose();
    if (onRegisterRequest) onRegisterRequest();
    else onLoginRequest();
  };

  const handleProfileRequest = () => {
    onClose();
    onProfileSettings?.();
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/85 p-4 backdrop-blur-xl" onClick={onClose}>
      <section
        className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-rose-300/15 bg-[#090911] p-6 text-white shadow-2xl shadow-black sm:p-8"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="nsfw-access-title"
      >
        <div className="absolute inset-x-8 top-0 h-px bg-rose-300/30" />

        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-rose-400/25 bg-rose-500/10 text-sm font-black tracking-[0.18em] text-rose-200">
            18+
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.26em] text-rose-300">The Vault NSFW</p>
            <h2 id="nsfw-access-title" className="text-2xl font-black tracking-tight">
              Vault NSFW Access
            </h2>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-sm leading-6 text-gray-300">
          This area contains adult NSFW content. You must be logged in, be 18+, and agree to the Terms of Use and Privacy Policy to enable access.
        </div>

        {!isLoggedIn ? (
          <div className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4 text-sm font-semibold text-amber-100">
            Voce precisa estar logado para acessar o Vault NSFW.
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            <label
              className={`flex cursor-pointer gap-3 rounded-2xl border p-4 transition ${
                isAdult ? 'border-rose-300/30 bg-rose-500/10' : 'border-white/10 bg-black/20 hover:border-white/20'
              }`}
            >
              <input
                type="checkbox"
                checked={isAdult}
                onChange={(event) => setIsAdult(event.target.checked)}
                className="mt-1 h-4 w-4 accent-rose-500"
              />
              <span className="text-sm text-gray-300">I confirm that I am 18 years old or older.</span>
            </label>

            <label
              className={`flex cursor-pointer gap-3 rounded-2xl border p-4 transition ${
                acceptedTerms ? 'border-rose-300/30 bg-rose-500/10' : 'border-white/10 bg-black/20 hover:border-white/20'
              }`}
            >
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(event) => setAcceptedTerms(event.target.checked)}
                className="mt-1 h-4 w-4 accent-rose-500"
              />
              <span className="text-sm text-gray-300">
                I agree to the Terms of Use and Privacy Policy.
              </span>
            </label>
          </div>
        )}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-gray-300 transition hover:bg-white/10 hover:text-white"
          >
            Cancel
          </button>
          {!isLoggedIn ? (
            <>
              <button
                type="button"
                onClick={handleRegisterRequest}
                className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-gray-200 transition hover:bg-white/10"
              >
                Register
              </button>
              <button
                type="button"
                onClick={handleLoginRequest}
                className="rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-500 px-5 py-3 text-sm font-black text-white shadow-lg shadow-violet-950/30 transition hover:scale-[1.02]"
              >
                Login
              </button>
            </>
          ) : (
            <>
              {onProfileSettings && (
                <button
                  type="button"
                  onClick={handleProfileRequest}
                  className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-gray-200 transition hover:bg-white/10"
                >
                  Go to Profile Settings
                </button>
              )}
              <button
                type="button"
                disabled={!canEnable}
                onClick={onConfirm}
                className="rounded-2xl bg-gradient-to-r from-rose-700 via-fuchsia-700 to-violet-700 px-5 py-3 text-sm font-black text-white shadow-lg shadow-rose-950/30 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
              >
                Enable NSFW Access
              </button>
            </>
          )}
        </div>
      </section>
    </div>
  );
};
