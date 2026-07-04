import { create } from 'zustand';

interface SettingsState {
  saveHistory: boolean;
  setSaveHistory: (value: boolean) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  saveHistory: true,
  setSaveHistory: (saveHistory) => set({ saveHistory }),
}));
