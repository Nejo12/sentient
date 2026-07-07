import { getShareExtensionKey } from 'expo-share-intent';

/** Intercept iOS share-extension deep links before expo-router resolves a missing route. */
export function redirectSystemPath({
  path,
}: {
  path: string;
  initial: string;
}): string {
  if (!path.includes('dataUrl=')) {
    return path;
  }

  try {
    if (path.includes(`dataUrl=${getShareExtensionKey()}`)) {
      return '/shareintent';
    }

    return path;
  } catch {
    return '/';
  }
}
