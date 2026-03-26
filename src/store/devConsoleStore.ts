import { create } from 'zustand';
import type { ConsoleTab, SceneData } from '@/types/dev-console';

interface DevConsoleState {
  isOpen: boolean;
  activeTab: ConsoleTab;
  currentScene: SceneData | null;
  uxAuditActive: boolean;

  toggle: () => void;
  open: () => void;
  close: () => void;
  setActiveTab: (tab: ConsoleTab) => void;
  setCurrentScene: (scene: SceneData | null) => void;
  toggleUXAudit: () => void;
}

export const useDevConsoleStore = create<DevConsoleState>((set) => ({
  isOpen: false,
  activeTab: 'intelligence',
  currentScene: null,
  uxAuditActive: false,

  toggle: () => set((s) => ({ isOpen: !s.isOpen })),
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setCurrentScene: (scene) => set({ currentScene: scene }),
  toggleUXAudit: () => set((s) => ({ uxAuditActive: !s.uxAuditActive })),
}));
