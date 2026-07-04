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
}));

jest.mock('expo-share-intent', () => ({
  useShareIntentContext: jest.fn(),
}));

const { router, useLocalSearchParams } = jest.requireMock('expo-router') as {
  router: { push: jest.Mock };
  useLocalSearchParams: jest.Mock;
};

const { addEventListener, getInitialURL } = jest.requireMock('expo-linking') as {
  addEventListener: jest.Mock;
  getInitialURL: jest.Mock;
};

const { useShareIntentContext } = jest.requireMock('expo-share-intent') as {
  useShareIntentContext: jest.Mock;
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
    addEventListener.mockReturnValue({ remove: jest.fn() });
    useShareIntentContext.mockReturnValue({
      hasShareIntent: false,
      shareIntent: null,
      resetShareIntent: jest.fn(),
    });
    useLocalSearchParams.mockReturnValue({
      message: "So you're just cancelling again?",
      name: 'Sam',
      app: 'WhatsApp',
    });
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
});
