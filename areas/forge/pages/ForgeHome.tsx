import React from 'react';
import { BackToPortalButton } from '../../../shared/components/BackToPortalButton';

interface ForgeHomeProps {
  isLoggedIn: boolean;
  username?: string;
  onBackToPortal: () => void;
  onLoginClick: () => void;
}

const plannedTools = [
  'Prompt Lab',
  'Vault Chat',
  'ComfyUI workflows',
  'Ollama model routing',
  'Prompt template engine',
  'Generation history',
];

export const ForgeHome: React.FC<ForgeHomeProps> = ({ isLoggedIn, username, onBackToPortal, onLoginClick }) => (
  <main className="min-h-screen overflow-hidden bg-[#05050a] text-white">
    <div className="fixed inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(16,185,129,0.16),transparent_34%),radial-gradient(circle_at_82%_18%,rgba(6,182,212,0.12),transparent_28%),linear-gradient(180deg,#05050a_0%,#07130f_52%,#05050a_100%)]" />
    <section className="relative z-10 mx-auto max-w-[92rem] px-5 py-8 sm:px-8">
      <header className="flex flex-col gap-6 border-b border-white/10 pb-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <BackToPortalButton onClick={onBackToPortal} tone="cyan" />
          <p className="mt-8 text-[10px] font-black uppercase tracking-[0.28em] text-emerald-200">Vault Forge</p>
          <h1 className="mt-4 text-5xl font-black leading-none tracking-tight text-white sm:text-6xl">
            Vault Forge / Prompt Lab
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-gray-400">
            Creative AI tooling for prompts, ComfyUI workflows, local Ollama models and generation history. This vault is scaffolded for the next implementation phase.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isLoggedIn ? (
            <span className="rounded-full border border-emerald-300/20 bg-emerald-500/10 px-4 py-2 text-xs font-bold text-emerald-100">
              Logged as {username}
            </span>
          ) : (
            <button
              type="button"
              onClick={onLoginClick}
              className="rounded-full border border-emerald-300/25 bg-emerald-500/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-100 transition hover:bg-emerald-500/20"
            >
              Login
            </button>
          )}
          <span className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-gray-200">
            Planned
          </span>
        </div>
      </header>

      <div className="mt-8 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-3xl border border-emerald-300/15 bg-gradient-to-br from-emerald-500/10 via-cyan-500/5 to-transparent p-6 shadow-2xl shadow-black/30">
          <p className="text-[10px] font-black uppercase tracking-[0.26em] text-emerald-200">Planned workflow</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight">Build prompts without fighting your machine</h2>
          <p className="mt-4 text-sm leading-7 text-gray-400">
            Forge will coordinate ComfyUI and Ollama so heavy generation has priority, low memory mode stays on by default, and prompts can be saved back into the global profile.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {plannedTools.map((tool) => (
              <div key={tool} className="rounded-2xl border border-white/10 bg-black/25 p-4">
                <p className="text-sm font-black text-white">{tool}</p>
                <p className="mt-2 text-xs leading-5 text-gray-500">Architecture ready, implementation planned.</p>
              </div>
            ))}
          </div>
        </section>

        <aside className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/25">
          <p className="text-[10px] font-black uppercase tracking-[0.26em] text-cyan-200">Performance rules</p>
          <ul className="mt-5 space-y-3 text-sm leading-6 text-gray-300">
            <li>ComfyUI generation has priority over chat and prompt analysis.</li>
            <li>Only one Ollama request should run at a time.</li>
            <li>Low Memory Mode should stay enabled by default.</li>
            <li>Prompt presets will support SDXL, Pony, Illustrious, Animagine, FLUX and Z-Image.</li>
          </ul>
        </aside>
      </div>
    </section>
  </main>
);
