import { render, waitFor } from '@testing-library/react-native';

import Index from '../app/index';
import { isOnboardingComplete } from '../src/services/onboardingStorage';
import { isSetupComplete } from '../src/services/setupStorage';

jest.mock('expo-router', () => ({
  Redirect: ({ href }: { href: string }) => {
    const { Text } = require('react-native');
    return <Text testID={`redirect-${href}`}>{href}</Text>;
  },
  router: {
    replace: jest.fn(),
  },
}));

jest.mock('expo-share-intent', () => ({
  useShareIntentContext: () => ({
    hasShareIntent: false,
    isReady: true,
  }),
}));

jest.mock('../src/services/onboardingStorage', () => ({
  isOnboardingComplete: jest.fn(),
}));

jest.mock('../src/services/setupStorage', () => ({
  isSetupComplete: jest.fn(),
}));

describe('index onboarding gate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('redirects to onboarding when onboarding is incomplete', async () => {
    (isOnboardingComplete as jest.Mock).mockResolvedValue(false);
    (isSetupComplete as jest.Mock).mockResolvedValue(false);

    const { getByTestId } = render(<Index />);

    await waitFor(() => {
      expect(getByTestId('redirect-/onboarding')).toBeTruthy();
    });
  });

  it('redirects to setup when onboarding is complete but setup is incomplete', async () => {
    (isOnboardingComplete as jest.Mock).mockResolvedValue(true);
    (isSetupComplete as jest.Mock).mockResolvedValue(false);

    const { getByTestId } = render(<Index />);

    await waitFor(() => {
      expect(getByTestId('redirect-/setup')).toBeTruthy();
    });
  });

  it('redirects to tabs when onboarding and setup are complete', async () => {
    (isOnboardingComplete as jest.Mock).mockResolvedValue(true);
    (isSetupComplete as jest.Mock).mockResolvedValue(true);

    const { getByTestId } = render(<Index />);

    await waitFor(() => {
      expect(getByTestId('redirect-/(tabs)')).toBeTruthy();
    });
  });
});
