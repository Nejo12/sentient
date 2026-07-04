import * as Clipboard from 'expo-clipboard';

import { copyToClipboard } from '../src/utils/clipboard';

jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn().mockResolvedValue(undefined),
}));

describe('clipboard util', () => {
  it('copies provided text with expo clipboard', async () => {
    await copyToClipboard('Copied text');

    expect(Clipboard.setStringAsync).toHaveBeenCalledWith('Copied text');
  });
});
