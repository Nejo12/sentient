jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  SETUP_COMPLETE_KEY,
  SETUP_SHARE_DONE_KEY,
  isSetupComplete,
  isShareSetupDone,
  setSetupComplete,
  setShareSetupDone,
} from '../src/services/setupStorage';

describe('setupStorage', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('returns false when setup is not complete', async () => {
    await expect(isSetupComplete()).resolves.toBe(false);
  });

  it('returns true after setup is marked complete', async () => {
    await setSetupComplete();
    await expect(isSetupComplete()).resolves.toBe(true);
    await expect(AsyncStorage.getItem(SETUP_COMPLETE_KEY)).resolves.toBe('true');
  });

  it('persists share setup done state', async () => {
    await expect(isShareSetupDone()).resolves.toBe(false);
    await setShareSetupDone();
    await expect(isShareSetupDone()).resolves.toBe(true);
    await expect(AsyncStorage.getItem(SETUP_SHARE_DONE_KEY)).resolves.toBe('true');
  });
});
