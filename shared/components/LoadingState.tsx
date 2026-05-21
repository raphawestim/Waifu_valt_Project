import React from 'react';

interface LoadingStateProps {
  count?: number;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ count = 4 }) => (
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035]">
        <div className="h-48 animate-pulse bg-gradient-to-br from-white/10 via-violet-500/10 to-cyan-500/10" />
        <div className="space-y-2 p-4">
          <div className="h-3 w-2/3 animate-pulse rounded-full bg-white/10" />
          <div className="h-2 w-1/2 animate-pulse rounded-full bg-white/5" />
        </div>
      </div>
    ))}
  </div>
);
