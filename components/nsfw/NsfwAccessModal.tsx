import React, { useState } from 'react';

interface NsfwAccessModalProps {
  isOpen: boolean;
  isLoggedIn: boolean;
  onClose: () => void;
  onLoginRequest: () => void;
  onConfirm: () => void;
}

export const NsfwAccessModal: React.FC<NsfwAccessModalProps> = ({
  isOpen,
  isLoggedIn,
  onClose,
  onLoginRequest,
  onConfirm,
}) => {
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  if (!isOpen) return null;

  const canEnter = isLoggedIn && acceptedTerms;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/85 p-4 backdrop-blur-xl" onClick={onClose}>
      <section
        className="relative w-full max-w-lg overflow-hidden rounded-[2rem] border border-white/10 bg-[#090911] p-6 text-white shadow-2xl shadow-black sm:p-8"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-red-600/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-8 h-56 w-56 rounded-full bg-violet-600/20 blur-3xl" />

        <div className="relative">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-red-400/25 bg-red-500/10 text-sm font-black tracking-[0.18em] text-red-200">
              18+
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.26em] text-red-300">The Vault NSFW</p>
              <h2 className="text-2xl font-black tracking-tight">Confirmar acesso adulto</h2>
            </div>
          </div>

          <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-sm leading-6 text-gray-300">
            <p>Esta area contem conteudo adulto, sensivel e NSFW, permitido apenas para usuarios maiores de 18 anos.</p>
            <p>Voce precisa estar logado para acessar a area The Vault NSFW.</p>
            <p>Ao entrar, voce confirma que aceita os Termos de Uso e a Politica de Privacidade da aplicacao.</p>
          </div>

          {!isLoggedIn && (
            <div className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4 text-sm text-amber-100">
              Login necessario. Entre com sua conta antes de liberar o acesso NSFW.
            </div>
          )}

          <label className={`mt-5 flex cursor-pointer gap-3 rounded-2xl border p-4 transition ${
            acceptedTerms ? 'border-violet-300/30 bg-violet-500/10' : 'border-white/10 bg-black/20 hover:border-white/20'
          }`}>
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(event) => setAcceptedTerms(event.target.checked)}
              className="mt-1 h-4 w-4 accent-violet-500"
            />
            <span className="text-sm text-gray-300">
              Eu confirmo que tenho 18 anos ou mais e aceito os Termos de Uso e a Politica de Privacidade.
            </span>
          </label>

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-gray-300 transition hover:bg-white/10 hover:text-white"
            >
              Cancelar
            </button>
            {!isLoggedIn ? (
              <button
                type="button"
                onClick={onLoginRequest}
                className="rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-500 px-5 py-3 text-sm font-black text-white shadow-lg shadow-violet-950/30 transition hover:scale-[1.02]"
              >
                Fazer login
              </button>
            ) : (
              <button
                type="button"
                disabled={!canEnter}
                onClick={onConfirm}
                className="rounded-2xl bg-gradient-to-r from-red-700 via-fuchsia-700 to-violet-700 px-5 py-3 text-sm font-black text-white shadow-lg shadow-red-950/30 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
              >
                Entrar no NSFW
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
