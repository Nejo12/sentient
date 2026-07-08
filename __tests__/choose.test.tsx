import { fireEvent, render, waitFor } from '@testing-library/react-native';

import ChooseScreen from '../app/(flow)/choose';
import { useSessionStore } from '../src/store/sessionStore';
import { fetchRewrites } from '../src/services/rewriteApi';
import type { RewriteOption } from '../src/types/rewrite';

jest.mock('expo-router', () => ({
  router: { push: jest.fn() },
  useLocalSearchParams: jest.fn(),
}));

jest.mock('../src/services/rewriteApi', () => ({
  fetchRewrites: jest.fn(),
}));

jest.mock('../src/services/entitlements', () => ({
  canRewrite: jest.fn().mockResolvedValue(true),
  incrementRewriteCount: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('expo-linking', () => ({
  addEventListener: jest.fn(),
  getInitialURL: jest.fn(),
  useLinkingURL: jest.fn(),
}));

jest.mock('expo-share-intent', () => ({
  useShareIntentContext: jest.fn(),
}));

jest.mock('expo-clipboard', () => ({
  getStringAsync: jest.fn(),
}));

const { router, useLocalSearchParams } = jest.requireMock('expo-router') as {
  router: { push: jest.Mock };
  useLocalSearchParams: jest.Mock;
};

const { addEventListener, getInitialURL, useLinkingURL } = jest.requireMock('expo-linking') as {
  addEventListener: jest.Mock;
  getInitialURL: jest.Mock;
  useLinkingURL: jest.Mock;
};

const { useShareIntentContext } = jest.requireMock('expo-share-intent') as {
  useShareIntentContext: jest.Mock;
};

const { getStringAsync } = jest.requireMock('expo-clipboard') as {
  getStringAsync: jest.Mock;
};

const rewriteOptions: RewriteOption[] = [
  {
    label: 'Calm and direct',
    tag: 'Calm',
    text: 'Thanks for being honest. I still want us to figure this out.',
    recommended: true,
  },
  {
    label: 'Calm and warm',
    tag: 'Warm',
    text: 'I hear you. I want to make this better and stay clear with you.',
    recommended: false,
  },
  {
    label: 'Calm and brief',
    tag: 'Brief',
    text: "I hear you, and I'd like to reset this properly.",
    recommended: false,
  },
];

describe('choose screen', () => {
  beforeEach(() => {
    useSessionStore.getState().reset();
    jest.clearAllMocks();
    getInitialURL.mockResolvedValue(null);
    useLinkingURL.mockReturnValue(null);
    addEventListener.mockReturnValue({ remove: jest.fn() });
    useShareIntentContext.mockReturnValue({
      hasShareIntent: false,
      shareIntent: null,
      resetShareIntent: jest.fn(),
      isReady: true,
    });
    useLocalSearchParams.mockReturnValue({
      message: "So you're just cancelling again?",
      name: 'Sam',
      app: 'WhatsApp',
    });
    getStringAsync.mockResolvedValue('');
  });

  it('fetches rewrites immediately for missing intent', async () => {
    (fetchRewrites as jest.Mock).mockResolvedValue({
      success: true,
      perspective: 'They may feel overlooked.',
      options: rewriteOptions,
    });

    const { getByText } = render(<ChooseScreen />);

    fireEvent.press(getByText('What am I missing?'));

    await waitFor(() => {
      expect(fetchRewrites).toHaveBeenCalledWith(
        expect.objectContaining({ intent: 'missing' }),
      );
    });

    expect(router.push).toHaveBeenCalledWith('/(flow)/compare');
    expect(useSessionStore.getState().intent).toBe('missing');
    expect(useSessionStore.getState().results).toEqual(rewriteOptions);
    expect(useSessionStore.getState().perspective).toBe('They may feel overlooked.');
  });

  it('shows understanding grid for do intent and fetches by chip', async () => {
    (fetchRewrites as jest.Mock).mockResolvedValue({
      success: true,
      perspective: null,
      options: rewriteOptions,
    });

    const { getByText } = render(<ChooseScreen />);

    fireEvent.press(getByText('What can I do?'));

    expect(getByText('How do you want to be understood?')).toBeTruthy();

    fireEvent.press(getByText('Calm'));

    await waitFor(() => {
      expect(fetchRewrites).toHaveBeenCalledWith(
        expect.objectContaining({ intent: 'do', understanding: 'calm' }),
      );
    });

    expect(router.push).toHaveBeenCalledWith('/(flow)/compare');
    expect(useSessionStore.getState().intent).toBe('do');
    expect(useSessionStore.getState().understanding).toBe('calm');
  });

  it('shows shared text from the native share intent', async () => {
    useShareIntentContext.mockReturnValue({
      hasShareIntent: true,
      shareIntent: {
        text: 'Are you free tomorrow?',
        meta: { title: 'Messages' },
      },
      resetShareIntent: jest.fn(),
      isReady: true,
    });

    const { getByText } = render(<ChooseScreen />);

    await waitFor(() => {
      expect(getByText('Are you free tomorrow?')).toBeTruthy();
    });
  });

  it('keeps showing the captured message after resetShareIntent clears the native context', async () => {
    // No route query params: this is how the screen is actually reached from
    // a native share (router.replace('/(flow)/choose') with no query args).
    useLocalSearchParams.mockReturnValue({});

    // useLinkingURL keeps returning the share-extension URL even after the
    // payload is consumed, exactly like real Expo Linking behaviour.
    useLinkingURL.mockReturnValue('sentient://dataUrl=sentientShareKey?nonce=abc#text');

    // Mirrors the real expo-share-intent hook: resetShareIntent() clears
    // hasShareIntent/shareIntent back to empty, and is a new function
    // reference on every render (see node_modules/expo-share-intent/build/useShareIntent.js).
    let mockState: { hasShareIntent: boolean; shareIntent: unknown } = {
      hasShareIntent: true,
      shareIntent: { text: 'Are you free tomorrow?', meta: { title: 'Messages' } },
    };
    useShareIntentContext.mockImplementation(() => ({
      ...mockState,
      isReady: true,
      resetShareIntent: () => {
        mockState = { hasShareIntent: false, shareIntent: null };
      },
    }));

    const { getByText, rerender } = render(<ChooseScreen />);

    await waitFor(() => {
      expect(getByText('Are you free tomorrow?')).toBeTruthy();
    });

    rerender(<ChooseScreen />);

    expect(getByText('Are you free tomorrow?')).toBeTruthy();
  });

  it('reads the clipboard and shows it when opened from the Android bubble with no message', async () => {
    useLocalSearchParams.mockReturnValue({
      sourceApp: 'Android',
    });
    getStringAsync.mockResolvedValue('Copied from a totally different app');

    const { getByText } = render(<ChooseScreen />);

    await waitFor(() => {
      expect(getStringAsync).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(getByText('Copied from a totally different app')).toBeTruthy();
    });
  });

  it('leaves the empty state intact when the clipboard is empty on the Android bubble route', async () => {
    useLocalSearchParams.mockReturnValue({
      sourceApp: 'Android',
    });
    getStringAsync.mockResolvedValue('');

    const { queryByText, queryByTestId } = render(<ChooseScreen />);

    await waitFor(() => {
      expect(getStringAsync).toHaveBeenCalled();
    });

    expect(useSessionStore.getState().capturedMessage).toBe('');
    expect(queryByText('Copied from a totally different app')).toBeNull();

    // The loading spinner must resolve once the clipboard check completes,
    // even though no usable text was found, otherwise the user is stuck on
    // a spinner forever (see prior bug: capturedMessage never gets set, so
    // isLoadingSharedMessage stayed true indefinitely).
    await waitFor(() => {
      expect(queryByTestId('shared-message-loading')).toBeNull();
    });
  });

  it('does not get stuck loading when the clipboard resolves to whitespace-only text on the Android bubble route', async () => {
    useLocalSearchParams.mockReturnValue({
      sourceApp: 'Android',
    });
    getStringAsync.mockResolvedValue('   ');

    const { queryByTestId, getByText } = render(<ChooseScreen />);

    await waitFor(() => {
      expect(getStringAsync).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(queryByTestId('shared-message-loading')).toBeNull();
    });

    expect(useSessionStore.getState().capturedMessage).toBe('');
    expect(getByText('What do you need?')).toBeTruthy();
  });
});
