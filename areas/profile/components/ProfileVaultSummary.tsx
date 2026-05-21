import React from 'react';

interface VaultSummary {
  title: string;
  accent: string;
  metrics: Array<{ label: string; value: string | number }>;
}

interface ProfileVaultSummaryProps {
  summaries: VaultSummary[];
}

export const ProfileVaultSummary: React.FC<ProfileVaultSummaryProps> = ({ summaries }) => (
  <section>
    <div className="mb-5">
      <p className="text-[10px] font-black uppercase tracking-[0.26em] text-cyan-200">Vault Summary</p>
      <h2 className="mt-2 text-3xl font-black tracking-tight text-white">Everything in one profile</h2>
    </div>
    <div className="grid gap-4 lg:grid-cols-3">
      {summaries.map((summary) => (
        <article key={summary.title} className={`rounded-3xl border bg-gradient-to-br p-5 shadow-xl shadow-black/25 ${summary.accent}`}>
          <h3 className="text-xl font-black text-white">{summary.title}</h3>
          <div className="mt-5 grid grid-cols-2 gap-3">
            {summary.metrics.map((metric) => (
              <div key={metric.label} className="rounded-2xl border border-white/10 bg-black/20 p-3">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-gray-500">{metric.label}</p>
                <p className="mt-2 text-2xl font-black text-white">{metric.value}</p>
              </div>
            ))}
          </div>
        </article>
      ))}
    </div>
  </section>
);
