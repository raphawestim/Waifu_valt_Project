
import React from 'react';

export const Spinner: React.FC<{ label?: string }> = ({ label }) => (
    <div className="flex flex-col items-center justify-center gap-6 py-12 select-none">
        {/* Multi-ring spinner */}
        <div className="relative w-20 h-20">
            {/* Outer ring */}
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-violet-500/80 animate-spin" style={{ animationDuration: '1.1s' }} />
            {/* Middle ring */}
            <div className="absolute inset-2 rounded-full border-4 border-transparent border-t-violet-400/60 animate-spin" style={{ animationDuration: '0.75s', animationDirection: 'reverse' }} />
            {/* Core glow */}
            <div className="absolute inset-5 rounded-full bg-violet-600/20 blur-sm animate-pulse" />
            {/* Logo icon center */}
            <svg className="absolute inset-0 m-auto w-8 h-8 opacity-70" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="#8b5cf6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
        </div>

        {/* Text */}
        <div className="flex flex-col items-center gap-1">
            <p className="text-sm font-bold text-gray-500 dark:text-gray-400 animate-pulse">
                {label || 'Loading…'}
            </p>
            {/* Progress bar */}
            <div className="w-32 h-0.5 bg-neutral-200 dark:bg-white/10 rounded-full overflow-hidden mt-1">
                <div
                    className="h-full bg-gradient-to-r from-violet-500 to-violet-400 rounded-full"
                    style={{ animation: 'progress-bar 2s ease-in-out infinite' }}
                />
            </div>
        </div>
    </div>
);

// Full-screen overlay spinner (used during page loads & image changes)
export const FullScreenSpinner: React.FC<{ label?: string }> = ({ label }) => (
    <div className="h-[60vh] flex items-center justify-center w-full">
        <Spinner label={label} />
    </div>
);
