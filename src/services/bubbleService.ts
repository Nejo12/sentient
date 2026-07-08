import { NativeModules, Platform } from 'react-native';

type SentientOverlayNativeModule = {
  startBubble?: () => Promise<void>;
  stopBubble?: () => Promise<void>;
  isBubbleRunning?: () => Promise<boolean>;
};

function getSentientOverlayModule(): SentientOverlayNativeModule | undefined {
  return NativeModules.SentientOverlay as SentientOverlayNativeModule | undefined;
}

/** Starts the floating bubble foreground service. No-op on iOS. */
export async function startBubble(): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }

  await getSentientOverlayModule()?.startBubble?.();
}

/** Stops the floating bubble foreground service. No-op on iOS. */
export async function stopBubble(): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }

  await getSentientOverlayModule()?.stopBubble?.();
}

/** Whether the bubble service is currently running. Always false on iOS. */
export async function isBubbleRunning(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return false;
  }

  return (await getSentientOverlayModule()?.isBubbleRunning?.()) ?? false;
}
