import React from 'react';

interface ErrorStateProps {
  message: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ message }) => (
  <div className="rounded-2xl border border-rose-300/20 bg-rose-500/10 p-4 text-sm font-semibold leading-6 text-rose-100">
    {message}
  </div>
);
