import React, { useState } from 'react';

interface PasswordInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  name: string;
  autoComplete: 'current-password' | 'new-password';
  error?: string;
}

export const PasswordInput: React.FC<PasswordInputProps> = ({
  label,
  value,
  onChange,
  placeholder,
  name,
  autoComplete,
  error,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const inputId = `${name}-input`;

  return (
    <label className="block" htmlFor={inputId}>
      <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-gray-400">{label}</span>
      <span className="relative block">
        <input
          id={inputId}
          name={name}
          type={isVisible ? 'text' : 'password'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${inputId}-error` : undefined}
          className={`h-14 w-full rounded-2xl border bg-black/35 px-4 pr-14 text-base font-semibold text-white outline-none transition placeholder:text-gray-600 focus:ring-4 focus:ring-violet-500/15 ${
            error ? 'border-rose-300/50 focus:border-rose-300/70' : 'border-white/10 focus:border-violet-300/60'
          }`}
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={() => setIsVisible((visible) => !visible)}
          aria-label={isVisible ? 'Hide password' : 'Show password'}
          className="absolute right-3 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-sm font-black text-gray-300 transition hover:bg-white/10 hover:text-white"
        >
          {isVisible ? (
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 3l18 18" />
              <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
              <path d="M9.9 4.2A10.7 10.7 0 0 1 12 4c5 0 8.6 4 10 8a14.2 14.2 0 0 1-2.1 3.6" />
              <path d="M6.4 6.4A13.9 13.9 0 0 0 2 12c1.4 4 5 8 10 8a10.8 10.8 0 0 0 4.2-.8" />
            </svg>
          ) : (
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      </span>
      {error && (
        <span id={`${inputId}-error`} className="mt-2 block text-xs font-semibold text-rose-100">
          {error}
        </span>
      )}
    </label>
  );
};
