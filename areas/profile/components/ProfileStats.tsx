import React from 'react';

interface StatItem {
  label: string;
  value: string | number;
}

interface ProfileStatsProps {
  items: StatItem[];
}

export const ProfileStats: React.FC<ProfileStatsProps> = ({ items }) => (
  <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
    {items.map((item) => (
      <div key={item.label} className="rounded-3xl border border-white/10 bg-white/[0.045] p-5 shadow-xl shadow-black/20">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">{item.label}</p>
        <p className="mt-3 text-3xl font-black text-white">{item.value}</p>
      </div>
    ))}
  </section>
);
