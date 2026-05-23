import React from 'react';

interface RouteLoadingStateProps {
  label?: string;
}

export const RouteLoadingState: React.FC<RouteLoadingStateProps> = ({ label = 'Loading Vault...' }) => (
  <main className="min-h-screen bg-[#05050a] text-white">
    <div className="fixed inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(124,58,237,0.2),transparent_34%),radial-gradient(circle_at_82%_16%,rgba(6,182,212,0.12),transparent_28%),linear-gradient(180deg,#05050a_0%,#0b0713_58%,#05050a_100%)]" />
    <section className="relative z-10 flex min-h-screen items-center justify-center px-5">
      <div className="rounded-3xl border border-white/10 bg-white/[0.045] p-8 text-center shadow-2xl shadow-black/35 backdrop-blur-xl">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-2 border-white/10 border-t-cyan-300" />
        <p className="mt-5 text-[10px] font-black uppercase tracking-[0.24em] text-cyan-100">{label}</p>
      </div>
    </section>
  </main>
);
