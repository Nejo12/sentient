import { router } from 'expo-router';

/**
 * Navigates back when there is back-history to return to, otherwise falls
 * back to the app's tab-bar home. Screens in the `(flow)` stack can be
 * reached with no back-history (e.g. the Android floating bubble opens
 * Choose via a deep link with FLAG_ACTIVITY_NEW_TASK, launching the app
 * fresh), so an unconditional `router.back()` would fail silently or log a
 * "GO_BACK was not handled" warning.
 */
export function goBackOrHome(): void {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace('/(tabs)');
  }
}
