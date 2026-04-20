import React from 'react';

interface NsfwModalProps {
    isOpen: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export const NsfwModal: React.FC<NsfwModalProps> = ({ isOpen, onConfirm, onCancel }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-neutral-50 dark:bg-[#111] max-w-md w-full rounded-2xl p-8 border border-black/5 dark:border-white/10 shadow-2xl shadow-red-900/10 dark:shadow-red-900/20 text-center animate-fade-in relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-red-600 to-rose-400"></div>
                
                <div className="w-16 h-16 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                    </svg>
                </div>
                
                <h3 className="text-2xl font-black text-white mb-3">Restricted Content</h3>
                <p className="text-gray-400 text-sm mb-8 leading-relaxed">
                    You are trying to access explicitly sensitive (NSFW) material or sources. This content is for adults only. By continuing, you confirm that you are at least 18 years old.
                </p>
                
                <div className="flex flex-col gap-3 sm:flex-row">
                    <button 
                        onClick={onCancel}
                        className="flex-1 py-3 px-4 rounded-xl font-bold bg-neutral-200 dark:bg-[#1a1a1a] text-gray-800 dark:text-white hover:bg-neutral-300 dark:hover:bg-white/10 transition border border-transparent dark:border-white/5"
                    >
                        Go Back
                    </button>
                    <button 
                        onClick={onConfirm}
                        className="flex-1 py-3 px-4 rounded-xl font-bold bg-red-600 text-white hover:bg-red-700 transition shadow-lg shadow-red-900/40"
                    >
                        I am 18+, Continue
                    </button>
                </div>
            </div>
        </div>
    );
};
