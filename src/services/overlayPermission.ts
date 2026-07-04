import * as Application from 'expo-application';
import * as IntentLauncher from 'expo-intent-launcher';
import { NativeModules, Platform } from 'react-native';

type SentientOverlayNativeModule = {
  canDrawOverlays?: () => Promise<boolean>;
};

function getSentientOverlayModule(): SentientOverlayNativeModule | undefined {
  return NativeModules.SentientOverlay as SentientOverlayNativeModule | undefined;
}

/** iOS does not use the bubble overlay; Android requires draw-over permission. */
export async function isOverlayPermissionGranted(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return true;
  }

  const nativeModule = getSentientOverlayModule();
  if (nativeModule?.canDrawOverlays) {
    return nativeModule.canDrawOverlays();
  }

  return false;
}

/** Opens the system overlay-permission screen for this app. No-op on iOS. */
export async function requestOverlayPermission(): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }

  const packageName = Application.applicationId;
  if (!packageName) {
    return;
  }

  await IntentLauncher.startActivityAsync(
    IntentLauncher.ActivityAction.MANAGE_APP_OVERLAY_PERMISSION,
    { data: `package:${packageName}` },
  );
}
