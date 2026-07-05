jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  DEFAULT_SETTINGS,
  SETTINGS_STORAGE_KEY,
  loadStoredSettings,
  saveStoredSettings,
} from '../src/services/settingsStorage';

describe('settingsStorage', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('returns defaults when nothing is stored', async () => {
    await expect(loadStoredSettings()).resolves.toEqual(DEFAULT_SETTINGS);
  });

  it('persists and reloads settings', async () => {
    const next = {
      defaultUnderstanding: 'firm' as const,
      editBeforeSend: false,
      saveHistory: false,
    };

    await saveStoredSettings(next);
    await expect(loadStoredSettings()).resolves.toEqual(next);
    await expect(AsyncStorage.getItem(SETTINGS_STORAGE_KEY)).resolves.toBe(
      JSON.stringify(next),
    );
  });

  it('falls back to defaults for invalid stored values', async () => {
    await AsyncStorage.setItem(
      SETTINGS_STORAGE_KEY,
      JSON.stringify({ defaultUnderstanding: 'invalid', editBeforeSend: true }),
    );

    await expect(loadStoredSettings()).resolves.toEqual(DEFAULT_SETTINGS);
  });
});
