jest.mock('expo-share-intent', () => ({
  getShareExtensionKey: () => 'sentientShareKey',
}));

import { redirectSystemPath } from '../app/+native-intent';

describe('redirectSystemPath', () => {
  it('redirects share-extension deep links to choose', () => {
    const path = 'dataUrl=sentientShareKey?nonce=abc#text';

    expect(
      redirectSystemPath({
        path,
        initial: path,
      }),
    ).toBe('/shareintent');
  });

  it('passes through normal paths unchanged', () => {
    expect(
      redirectSystemPath({
        path: '/(tabs)',
        initial: '/(tabs)',
      }),
    ).toBe('/(tabs)');
  });
});
