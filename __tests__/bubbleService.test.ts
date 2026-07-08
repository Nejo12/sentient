import { NativeModules, Platform } from 'react-native';

import { isBubbleRunning, startBubble, stopBubble } from '../src/services/bubbleService';

describe('bubbleService', () => {
  beforeEach(() => {
    (NativeModules as Record<string, unknown>).SentientOverlay = {
      startBubble: jest.fn().mockResolvedValue(undefined),
      stopBubble: jest.fn().mockResolvedValue(undefined),
      isBubbleRunning: jest.fn().mockResolvedValue(true),
    };
    Platform.OS = 'android';
  });

  it('calls the native startBubble on Android', async () => {
    await startBubble();
    expect(NativeModules.SentientOverlay.startBubble).toHaveBeenCalled();
  });

  it('calls the native stopBubble on Android', async () => {
    await stopBubble();
    expect(NativeModules.SentientOverlay.stopBubble).toHaveBeenCalled();
  });

  it('returns the native isBubbleRunning result on Android', async () => {
    await expect(isBubbleRunning()).resolves.toBe(true);
  });

  it('is a no-op on iOS', async () => {
    Platform.OS = 'ios';
    (NativeModules as Record<string, unknown>).SentientOverlay = undefined;

    await expect(startBubble()).resolves.toBeUndefined();
    await expect(stopBubble()).resolves.toBeUndefined();
    await expect(isBubbleRunning()).resolves.toBe(false);
  });
});
