import { fireEvent, render, waitFor } from '@testing-library/react-native';

import HistoryScreen from '../app/(tabs)/history';
import { strings } from '../src/constants/strings';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('expo-router', () => {
  const React = require('react');

  return {
    router: {
      push: jest.fn(),
    },
    useFocusEffect: (callback: () => void) => {
      React.useEffect(() => {
        callback();
      }, [callback]);
    },
  };
});

const mockListRewrites = jest.fn();

jest.mock('../src/services/historyService', () => ({
  formatRewriteTime: (iso: string) => iso,
  getRewriteSectionLabel: () => 'Today',
  getRewriteTitle: (record: { contactName: string; intent: string }) =>
    record.intent === 'do' ? `Reply to ${record.contactName}` : `Message to ${record.contactName}`,
  listRewrites: (...args: unknown[]) => mockListRewrites(...args),
}));

const { router } = jest.requireMock('expo-router') as {
  router: { push: jest.Mock };
};

const fullRewrite =
  "I'm really sorry — I hate that this keeps landing on you. I want us to reset properly and agree on a plan that feels reliable for both of us.";

const mockRecords = [
  {
    id: '1',
    contactName: 'Sam',
    sourceApp: 'WhatsApp',
    intent: 'do' as const,
    understanding: 'compassionate' as const,
    snippet: "I'm really sorry — I hate that this keeps landing on you.",
    fullText: fullRewrite,
    createdAt: new Date().toISOString(),
  },
];

describe('history screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockListRewrites.mockResolvedValue(mockRecords);
  });

  it('renders rewrites and filters by search', async () => {
    const { getByText, getByPlaceholderText, queryByText } = render(<HistoryScreen />);

    await waitFor(() => {
      expect(getByText('Reply to Sam')).toBeTruthy();
    });

    fireEvent.changeText(
      getByPlaceholderText(strings.history.searchPlaceholder),
      'missing person',
    );

    expect(queryByText('Reply to Sam')).toBeNull();
    expect(getByText(strings.history.emptySearch)).toBeTruthy();
  });

  it('makes the whole history card expandable and exposes its state', async () => {
    const { getByLabelText, getByText } = render(<HistoryScreen />);

    const card = await waitFor(() => getByLabelText(expect.stringContaining('Reply to Sam')));

    expect(card.props.accessibilityState).toEqual({ expanded: false });
    expect(getByText(strings.history.expandHint)).toBeTruthy();

    fireEvent.press(card);

    expect(card.props.accessibilityState).toEqual({ expanded: true });
    expect(getByText(strings.history.collapseHint)).toBeTruthy();
    expect(getByText(fullRewrite)).toBeTruthy();
  });

  it('opens settings from header button', async () => {
    const { getByLabelText } = render(<HistoryScreen />);

    await waitFor(() => {
      expect(getByLabelText('Open settings')).toBeTruthy();
    });

    fireEvent.press(getByLabelText('Open settings'));
    expect(router.push).toHaveBeenCalledWith('/(tabs)/you');
  });
});