import React, { useEffect, useState } from 'react';
import type { PerformanceState } from '../../types/ai.types';
import localAIExecutionManager from '../../services/LocalAIExecutionManager';

const getLabel = (state: PerformanceState): string => {
  if (state.comfyuiBusy) return 'Local AI blocked - ComfyUI working';
  if (state.ollamaBusy) return `Local AI busy - ${state.activeTask === 'prompt_lab' ? 'Prompt Lab' : 'Vault Chat'}`;
  return 'Local AI idle';
};

export const usePerformanceState = (): PerformanceState => {
  const [state, setState] = useState<PerformanceState>(localAIExecutionManager.getPerformanceState());

  useEffect(() => localAIExecutionManager.subscribeToPerformanceState(setState), []);

  return state;
};

export const LocalAIStatus: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const state = usePerformanceState();

  return (
    <div className={`flex flex-wrap items-center gap-2 ${compact ? 'text-[10px]' : 'text-xs'}`}>
      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-bold ${
        state.comfyuiBusy
          ? 'border-amber-400/30 bg-amber-500/10 text-amber-500'
          : state.comfyuiOnline
            ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-500'
            : 'border-red-400/30 bg-red-500/10 text-red-500'
      }`}>
        <span className="h-1.5 w-1.5 rounded-full bg-current" />
        ComfyUI: {state.comfyuiBusy ? 'processing' : state.comfyuiOnline ? 'idle' : 'offline'}
      </span>
      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-bold ${
        state.ollamaBusy
          ? 'border-violet-400/30 bg-violet-500/10 text-violet-500'
          : 'border-white/10 bg-white/5 text-gray-400'
      }`}>
        {getLabel(state)}
      </span>
      {state.activeModel && (
        <span className="hidden sm:inline-flex rounded-full border border-white/10 bg-white/5 px-2.5 py-1 font-bold text-gray-400">
          Model: {state.activeModel}
        </span>
      )}
      {state.lowMemoryMode && (
        <span className="hidden md:inline-flex rounded-full border border-cyan-400/20 bg-cyan-500/10 px-2.5 py-1 font-bold text-cyan-500">
          Low memory
        </span>
      )}
    </div>
  );
};
