import * as IntentLauncher from 'expo-intent-launcher';
import { NativeModules, Platform } from 'react-native';

import {
  isOverlayPermissionGranted,
  requestOverlayPermission,
} from '../src/services/overlayPermission';

let mockApplicationId: string | null = 'com.sentient.app';

jest.mock('expo-application', () => ({
  get applicationId() {
    return mockApplicationId;
  },
}));

jest.mock('expo-intent-launcher', () => ({
  ActivityAction: {
    MANAGE_APP_OVERLAY_PERMISSION: 'android.settings.MANAGE_APP_OVERLAY_PERMISSION',
  },
  startActivityAsync: jest.fn(),
}));

describe('overlayPermission', () => {
  const originalPlatform = Platform.OS;

  beforeEach(() => {
    jest.clearAllMocks();
    mockApplicationId = 'com.sentient.app';
    delete NativeModules.SentientOverlay;
  });

  afterEach(() => {
    Platform.OS = originalPlatform;
  });

  it('returns true on iOS without calling native module', async () => {
    Platform.OS = 'ios';

    await expect(isOverlayPermissionGranted()).resolves.toBe(true);
  });

  it('returns false on Android when native module is unavailable', async () => {
    Platform.OS = 'android';

    await expect(isOverlayPermissionGranted()).resolves.toBe(false);
  });

  it('delegates Android check to SentientOverlay native module', async () => {
    Platform.OS = 'android';
    NativeModules.SentientOverlay = {
      canDrawOverlays: jest.fn().mockResolvedValue(true),
    };

    await expect(isOverlayPermissionGranted()).resolves.toBe(true);
    expect(NativeModules.SentientOverlay.canDrawOverlays).toHaveBeenCalled();
  });

  it('opens overlay settings on Android', async () => {
    Platform.OS = 'android';

    await requestOverlayPermission();

    expect(IntentLauncher.startActivityAsync).toHaveBeenCalledWith(
      IntentLauncher.ActivityAction.MANAGE_APP_OVERLAY_PERMISSION,
      { data: 'package:com.sentient.app' },
    );
  });

  it('does not open settings on iOS', async () => {
    Platform.OS = 'ios';

    await requestOverlayPermission();

    expect(IntentLauncher.startActivityAsync).not.toHaveBeenCalled();
  });

  it('skips Android request when applicationId is missing', async () => {
    Platform.OS = 'android';
    mockApplicationId = null;

    await requestOverlayPermission();

    expect(IntentLauncher.startActivityAsync).not.toHaveBeenCalled();
  });
});
