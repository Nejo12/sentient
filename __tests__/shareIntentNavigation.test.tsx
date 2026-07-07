import { render } from '@testing-library/react-native';

import { ShareIntentNavigation } from '../src/components/ShareIntentNavigation';

const mockReplace = jest.fn();

jest.mock('expo-linking', () => ({
  useLinkingURL: jest.fn(),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
}));

jest.mock('expo-share-intent', () => ({
  useShareIntentContext: jest.fn(),
}));

const { useLinkingURL } = jest.requireMock('expo-linking') as {
  useLinkingURL: jest.Mock;
};

const { useShareIntentContext } = jest.requireMock('expo-share-intent') as {
  useShareIntentContext: jest.Mock;
};

describe('ShareIntentNavigation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useLinkingURL.mockReturnValue(null);
    useShareIntentContext.mockReturnValue({
      hasShareIntent: false,
      isReady: true,
    });
  });

  it('does not redirect on share URL before native payload is ready', () => {
    useLinkingURL.mockReturnValue('sentient://dataUrl=sentientShareKey?nonce=abc#text');

    render(<ShareIntentNavigation />);

    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('redirects when a native share intent is ready', () => {
    useShareIntentContext.mockReturnValue({
      hasShareIntent: true,
      isReady: true,
    });

    render(<ShareIntentNavigation />);

    expect(mockReplace).toHaveBeenCalledWith('/(flow)/choose');
  });
});
