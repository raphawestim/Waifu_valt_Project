import type { ActiveTask, PerformanceState } from '../types/ai.types';
import { getSettings, subscribeToSettings } from './settingsService';

type PerformanceSubscriber = (state: PerformanceState) => void;

class LocalAIExecutionManager {
  private state: PerformanceState = {
    comfyuiOnline: false,
    comfyuiBusy: false,
    ollamaOnline: false,
    ollamaBusy: false,
    activeTask: 'none',
    activeModel: null,
    lowMemoryMode: getSettings().lowMemoryMode,
  };

  private subscribers = new Set<PerformanceSubscriber>();

  constructor() {
    subscribeToSettings(settings => {
      this.patchState({ lowMemoryMode: settings.lowMemoryMode });
    });
  }

  canRunOllamaTask(): boolean {
    return !this.state.comfyuiBusy && !this.state.ollamaBusy && this.state.activeTask === 'none';
  }

  startOllamaTask(taskType: Exclude<ActiveTask, 'none' | 'comfyui'>, model: string): void {
    if (!this.canRunOllamaTask()) {
      throw new Error('Local AI is busy or blocked by ComfyUI.');
    }

    this.patchState({
      ollamaBusy: true,
      activeTask: taskType,
      activeModel: model,
    });
  }

  finishOllamaTask(): void {
    if (this.state.activeTask === 'prompt_lab' || this.state.activeTask === 'vault_chat') {
      this.patchState({
        ollamaBusy: false,
        activeTask: 'none',
        activeModel: null,
      });
    }
  }

  startComfyUITask(): void {
    this.patchState({
      comfyuiBusy: true,
      activeTask: 'comfyui',
      activeModel: null,
    });
  }

  finishComfyUITask(): void {
    if (this.state.activeTask === 'comfyui') {
      this.patchState({
        comfyuiBusy: false,
        activeTask: 'none',
      });
    } else {
      this.patchState({ comfyuiBusy: false });
    }
  }

  isComfyUIBusy(): boolean {
    return this.state.comfyuiBusy;
  }

  isOllamaBusy(): boolean {
    return this.state.ollamaBusy;
  }

  getPerformanceState(): PerformanceState {
    return { ...this.state };
  }

  setComfyUIStatus(online: boolean, busy: boolean): void {
    if (busy) {
      this.patchState({
        comfyuiOnline: online,
        comfyuiBusy: true,
        activeTask: this.state.ollamaBusy ? this.state.activeTask : 'comfyui',
      });
      return;
    }

    this.patchState({
      comfyuiOnline: online,
      comfyuiBusy: false,
      activeTask: this.state.activeTask === 'comfyui' ? 'none' : this.state.activeTask,
    });
  }

  setOllamaOnline(online: boolean): void {
    this.patchState({ ollamaOnline: online });
  }

  subscribeToPerformanceState(callback: PerformanceSubscriber): (() => void) {
    this.subscribers.add(callback);
    callback(this.getPerformanceState());
    return () => this.subscribers.delete(callback);
  }

  private patchState(patch: Partial<PerformanceState>): void {
    this.state = { ...this.state, ...patch };
    this.subscribers.forEach(callback => callback(this.getPerformanceState()));
  }
}

export const localAIExecutionManager = new LocalAIExecutionManager();
export default localAIExecutionManager;
