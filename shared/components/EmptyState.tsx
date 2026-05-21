import React from 'react';

interface EmptyStateProps {
  message: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ message }) => (
  <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-6 text-sm font-semibold leading-6 text-gray-400">
    {message}
  </div>
);
