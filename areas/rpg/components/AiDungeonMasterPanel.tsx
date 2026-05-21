import React from 'react';

export const AiDungeonMasterPanel: React.FC = () => (
  <section className="rounded-3xl border border-amber-300/15 bg-gradient-to-br from-red-500/10 via-amber-500/10 to-transparent p-5">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-amber-200">AI Dungeon Master</p>
        <h2 className="mt-2 text-2xl font-black text-white">Local AI campaign companion</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-400">
          Use a local AI model to narrate scenes, control NPCs, generate quests and continue campaign sessions.
        </p>
      </div>
      <span className="rounded-full border border-amber-300/25 bg-amber-500/10 px-3 py-1 text-xs font-black text-amber-100">Planned / Beta</span>
    </div>
    <div className="mt-5 flex flex-wrap gap-3">
      {['Start AI Session', 'Generate Quest Hook', 'Generate NPC'].map((label) => (
        <button key={label} disabled className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-black text-gray-500">
          {label}
        </button>
      ))}
    </div>
  </section>
);
