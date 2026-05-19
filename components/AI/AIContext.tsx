import React, { createContext, useContext, useMemo, useState } from 'react';
import type { ImageAnalysisResult, PromptHistoryItem, PromptLabImageContext } from '../../types/ai.types';

interface VaultChatContextPayload {
  text?: string;
  analysis?: ImageAnalysisResult;
  historyItem?: PromptHistoryItem;
  image?: PromptLabImageContext;
}

interface AIContextValue {
  promptLabImage: PromptLabImageContext | null;
  setPromptLabImage: (image: PromptLabImageContext | null) => void;
  vaultChatOpen: boolean;
  setVaultChatOpen: (open: boolean) => void;
  vaultChatContext: VaultChatContextPayload | null;
  sendToVaultChat: (payload: VaultChatContextPayload) => void;
}

const AIContext = createContext<AIContextValue | null>(null);

export const AIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [promptLabImage, setPromptLabImage] = useState<PromptLabImageContext | null>(null);
  const [vaultChatOpen, setVaultChatOpen] = useState(false);
  const [vaultChatContext, setVaultChatContext] = useState<VaultChatContextPayload | null>(null);

  const value = useMemo<AIContextValue>(() => ({
    promptLabImage,
    setPromptLabImage,
    vaultChatOpen,
    setVaultChatOpen,
    vaultChatContext,
    sendToVaultChat: payload => {
      setVaultChatContext(payload);
      setVaultChatOpen(true);
    },
  }), [promptLabImage, vaultChatContext, vaultChatOpen]);

  return <AIContext.Provider value={value}>{children}</AIContext.Provider>;
};

export const useAI = (): AIContextValue => {
  const context = useContext(AIContext);
  if (!context) throw new Error('useAI must be used inside AIProvider');
  return context;
};
