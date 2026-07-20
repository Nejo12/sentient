import { fireEvent, render, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import CompareScreen from '../app/(flow)/compare';
import { listRewrites, resetHistoryForTests } from '../src/services/historyService';
import { fetchRewrites } from '../src/services/rewriteApi';
import { useSessionStore } from '../src/store/sessionStore';
import { useSettingsStore } from '../src/store/settingsStore';
import type { RewriteOption } from '../src/types/rewrite';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn(), replace: jest.fn(), canGoBack: jest.fn() },
}));

jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../src/services/rewriteApi', () => ({
  fetchRewrites: jest.fn(),
}));

jest.mock('../src/services/entitlements', () => ({
  canRewrite: jest.fn().mockResolvedValue(true),
  incrementRewriteCount: jest.fn().mockResolvedValue(undefined),
}));

const { router } = jest.requireMock('expo-router') as {
  router: { push: jest.Mock; back: jest.Mock; replace: jest.Mock; canGoBack: jest.Mock };
};
const Clipboard = jest.requireMock('expo-clipboard') as {
  setStringAsync: jest.Mock;
};

const rewriteOptions: RewriteOption[] = [
  {
    label: 'Calm and direct',
    tag: 'Calm',
    text: 'Thanks for saying this plainly. I want us to reset with care.',
    recommended: true,
    rationale: 'It acknowledges the message and proposes a constructive next step.',
    understandingScore: 88,
    risks: [],
  },
  {
    label: 'Calm and warm',
    tag: 'Warm',
    text: 'I hear where you are coming from, and I want us to work through this.',
    recommended: false,
    rationale: 'It validates their position before expressing a shared goal.',
    understandingScore: 84,
    risks: ['Could feel vague without a concrete next step.'],
  },
  {
    label: 'Calm and brief',
    tag: 'Brief',
    text: 'I hear you. Let us reset and move forward clearly.',
    recommended: false,
    rationale: 'It reduces friction and keeps the reply concise.',
    understandingScore: 76,
    risks: ['May sound too brief for a sensitive exchange.'],
  },
];

describe('compare screen', () => {
  beforeEach(async () => {
    useSessionStore.getState().reset();
    useSettingsStore.getState().resetForTests();
    resetHistoryForTests();
    await AsyncStorage.clear();
    jest.clearAllMocks();
    useSessionStore.setState({
      capturedMessage: "So you're just cancelling again?",
      contactName: 'Sam',
      sourceApp: 'WhatsApp',
      roughDraft: '',
      intent: 'do',
      understanding: 'calm',
      results: rewriteOptions,
      perspective: null,
      loading: false,
      error: null,
    });
    router.canGoBack.mockReturnValue(true);
  });

  it('shows three loading skeleton cards with no spinner', () => {
    useSessionStore.setState({ loading: true });

    const { queryByText, getAllByTestId } = render(<CompareScreen />);

    expect(getAllByTestId('compare-skeleton-card')).toHaveLength(3);
    expect(queryByText('Finding options for you...')).toBeNull();
  });

  it('shows perspective card when intent is missing', () => {
    useSessionStore.setState({
      intent: 'missing',
      understanding: null,
      perspective: 'They might be protecting themselves rather than dismissing you.',
    });

    const { getByText } = render(<CompareScreen />);

    expect(getByText('Before you reply')).toBeTruthy();
    expect(getByText('What you might be missing')).toBeTruthy();
    expect(
      getByText('They might be protecting themselves rather than dismissing you.'),
    ).toBeTruthy();
  });

  it('shows why a reply may work and its understanding score', () => {
    const { getAllByText, getByText } = render(<CompareScreen />);

    expect(getAllByText('Why this may work')).toHaveLength(3);
    expect(getByText('It acknowledges the message and proposes a constructive next step.')).toBeTruthy();
    expect(getByText('88%')).toBeTruthy();
  });

  it('copies and sends back selected option', async () => {
    const { getAllByText } = render(<CompareScreen />);

    fireEvent.press(getAllByText('Copy')[0]);
    fireEvent.press(getAllByText('Send back')[1]);

    await waitFor(() => {
      expect(Clipboard.setStringAsync).toHaveBeenCalledWith(rewriteOptions[0].text);
    });

    expect(useSessionStore.getState().chosenReply).toBe(rewriteOptions[1].text);
    expect(router.push).toHaveBeenCalledWith('/(flow)/send-back');
  });

  it('saves to history when copying directly from Compare, without visiting Send Back', async () => {
    const { getAllByText } = render(<CompareScreen />);

    fireEvent.press(getAllByText('Copy')[0]);

    await waitFor(async () => {
      const records = await listRewrites();
      expect(records[0]?.fullText).toBe(rewriteOptions[0].text);
    });

    const records = await listRewrites();
    expect(records[0]?.contactName).toBe('Sam');
    expect(records[0]?.sourceApp).toBe('WhatsApp');
  });

  it('does not save to history when the save-history setting is off', async () => {
    useSettingsStore.setState({ saveHistory: false });

    const { getAllByText } = render(<CompareScreen />);
    fireEvent.press(getAllByText('Copy')[0]);

    await waitFor(() => {
      expect(Clipboard.setStringAsync).toHaveBeenCalledWith(rewriteOptions[0].text);
    });

    const records = await listRewrites();
    expect(records.some((record) => record.fullText === rewriteOptions[0].text)).toBe(false);
  });

  it('regenerates by calling rewrite API with current params', async () => {
    (fetchRewrites as jest.Mock).mockResolvedValue({
      success: true,
      perspective: null,
      interpretations: [],
      options: rewriteOptions,
    });

    const { getByText } = render(<CompareScreen />);
    fireEvent.press(getByText('Try another way to be understood'));

    await waitFor(() => {
      expect(fetchRewrites).toHaveBeenCalledWith(
        expect.objectContaining({
          capturedMessage: "So you're just cancelling again?",
          intent: 'do',
          understanding: 'calm',
          contactName: 'Sam',
        }),
      );
    });
  });

  it('goes back when the back button is pressed and there is back-history', () => {
    router.canGoBack.mockReturnValue(true);

    const { getAllByRole } = render(<CompareScreen />);
    fireEvent.press(getAllByRole('button')[0]);

    expect(router.back).toHaveBeenCalledTimes(1);
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('falls back to the tab-bar home when the back button is pressed with no back-history', () => {
    router.canGoBack.mockReturnValue(false);
    const { getAllByRole } = render(<CompareScreen />);
    fireEvent.press(getAllByRole('button')[0]);

    expect(router.back).not.toHaveBeenCalled();
    expect(router.replace).toHaveBeenCalledWith('/(tabs)');
  });
});
