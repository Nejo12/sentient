export function redirectSystemPath({ path }: { path: string; initial: boolean }): string {
  try {
    const url = new URL(path);

    if (url.protocol === 'sentient:' && url.hostname === 'diagnostics') {
      return '/diagnostics';
    }
  } catch {
    // Expo Router may already provide a normalised path instead of a full URL.
  }

  return path;
}
