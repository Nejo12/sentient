import { render, waitFor } from '@testing-library/react-native';

import Index from '../app/index';
import { isSetupComplete } from '../src/services/setupStorage';

jest.mock('expo-router', () => ({
  Redirect: ({ href }: { href: string }) => {
    const { Text } = require('react-native');
    return <Text testID={`redirect-${href}`}>{href}</Text>;
  },
}));

jest.mock('../src/services/setupStorage', () => ({
  isSetupComplete: jest.fn(),
}));

describe('index onboarding gate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('redirects to setup when onboarding is incomplete', async () => {
    (isSetupComplete as jest.Mock).mockResolvedValue(false);

    const { getByTestId } = render(<Index />);

    await waitFor(() => {
      expect(getByTestId('redirect-/setup')).toBeTruthy();
    });
  });

  it('redirects to tabs when onboarding is complete', async () => {
    (isSetupComplete as jest.Mock).mockResolvedValue(true);

    const { getByTestId } = render(<Index />);

    await waitFor(() => {
      expect(getByTestId('redirect-/(tabs)')).toBeTruthy();
    });
  });
});
