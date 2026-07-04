import { create } from 'zustand';

import {
  DEFAULT_SETTINGS,
  loadStoredSettings,
  saveStoredSettings,
  type StoredSettings,
} from '../services/settingsStorage';
import { fetchRemoteSettings, syncSettingsToRemote } from '../services/settingsService';
import type { Understanding } from '../types/rewrite';

interface SettingsState extends StoredSettings {
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setDefaultUnderstanding: (value: Understanding) => Promise<void>;
  setEditBeforeSend: (value: boolean) => Promise<void>;
  setSaveHistory: (value: boolean) => Promise<void>;
  resetForTests: () => void;
}

async function persistSettings(settings: StoredSettings): Promise<void> {
  await saveStoredSettings(settings);
  await syncSettingsToRemote(settings);
}

function pickPersisted(state: SettingsState): StoredSettings {
  return {
    defaultUnderstanding: state.defaultUnderstanding,
    editBeforeSend: state.editBeforeSend,
    saveHistory: state.saveHistory,
  };
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...DEFAULT_SETTINGS,
  hydrated: false,
  hydrate: async () => {
    const local = await loadStoredSettings();
    const remote = await fetchRemoteSettings();
    const merged = remote ?? local;

    set({ ...merged, hydrated: true });
    await saveStoredSettings(merged);
  },
  setDefaultUnderstanding: async (defaultUnderstanding) => {
    set({ defaultUnderstanding });
    await persistSettings(pickPersisted(get()));
  },
  setEditBeforeSend: async (editBeforeSend) => {
    set({ editBeforeSend });
    await persistSettings(pickPersisted(get()));
  },
  setSaveHistory: async (saveHistory) => {
    set({ saveHistory });
    await persistSettings(pickPersisted(get()));
  },
  resetForTests: () => set({ ...DEFAULT_SETTINGS, hydrated: false }),
}));
