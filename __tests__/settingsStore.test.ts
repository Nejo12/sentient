jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

import AsyncStorage from '@react-native-async-storage/async-storage';

import { SETTINGS_STORAGE_KEY } from '../src/services/settingsStorage';
import { useSettingsStore } from '../src/store/settingsStore';

jest.mock('../src/services/settingsService', () => ({
  fetchRemoteSettings: jest.fn().mockResolvedValue(null),
  syncSettingsToRemote: jest.fn().mockResolvedValue(undefined),
}));

describe('settingsStore', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    useSettingsStore.getState().resetForTests();
    jest.clearAllMocks();
  });

  it('starts with default values', () => {
    expect(useSettingsStore.getState().defaultUnderstanding).toBe('calm');
    expect(useSettingsStore.getState().editBeforeSend).toBe(true);
    expect(useSettingsStore.getState().saveHistory).toBe(true);
  });

  it('hydrates from AsyncStorage', async () => {
    await AsyncStorage.setItem(
      SETTINGS_STORAGE_KEY,
      JSON.stringify({
        defaultUnderstanding: 'professional',
        editBeforeSend: false,
        saveHistory: false,
      }),
    );

    await useSettingsStore.getState().hydrate();

    expect(useSettingsStore.getState().defaultUnderstanding).toBe('professional');
    expect(useSettingsStore.getState().editBeforeSend).toBe(false);
    expect(useSettingsStore.getState().saveHistory).toBe(false);
    expect(useSettingsStore.getState().hydrated).toBe(true);
  });

  it('persists toggle changes locally', async () => {
    await useSettingsStore.getState().hydrate();
    await useSettingsStore.getState().setEditBeforeSend(false);

    expect(useSettingsStore.getState().editBeforeSend).toBe(false);
    await expect(AsyncStorage.getItem(SETTINGS_STORAGE_KEY)).resolves.toBe(
      JSON.stringify({
        defaultUnderstanding: 'calm',
        editBeforeSend: false,
        saveHistory: true,
      }),
    );
  });
});
