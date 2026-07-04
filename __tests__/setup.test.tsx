import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { Linking } from 'react-native';

import SetupScreen from '../app/setup';
import {
  isShareSetupDone,
  setSetupComplete,
  setShareSetupDone,
} from '../src/services/setupStorage';

jest.mock('expo-router', () => ({
  router: { replace: jest.fn(), push: jest.fn() },
}));

jest.mock('../src/services/setupStorage', () => ({
  isShareSetupDone: jest.fn(),
  setSetupComplete: jest.fn(),
  setShareSetupDone: jest.fn(),
}));

const { router } = jest.requireMock('expo-router') as {
  router: { replace: jest.Mock; push: jest.Mock };
};

describe('setup screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (isShareSetupDone as jest.Mock).mockResolvedValue(false);
    (setSetupComplete as jest.Mock).mockResolvedValue(undefined);
    (setShareSetupDone as jest.Mock).mockResolvedValue(undefined);
    jest.spyOn(Linking, 'openSettings').mockResolvedValue(undefined);
  });

  it('renders welcome copy and privacy reassurance', async () => {
    const { getByText } = render(<SetupScreen />);

    expect(getByText('Welcome to Sentient')).toBeTruthy();
    expect(getByText('Add to your Share sheet')).toBeTruthy();
    expect(
      getByText(
        'Sentient only reads a message when you share it. It never watches your chats in the background.',
      ),
    ).toBeTruthy();
  });

  it('marks share row done after opening settings', async () => {
    const { getByText, getByTestId } = render(<SetupScreen />);

    fireEvent.press(getByText('Add to your Share sheet'));

    await waitFor(() => {
      expect(Linking.openSettings).toHaveBeenCalled();
      expect(setShareSetupDone).toHaveBeenCalled();
      expect(getByTestId('share-done-badge')).toBeTruthy();
    });
  });

  it('continues to choose flow in dev with sample params', async () => {
    const { getByText } = render(<SetupScreen />);

    fireEvent.press(getByText('Continue'));

    await waitFor(() => {
      expect(setSetupComplete).toHaveBeenCalled();
      expect(router.replace).toHaveBeenCalledWith({
        pathname: '/(flow)/choose',
        params: {
          message: "So you're just cancelling again? Cool. Guess I'll figure it out myself.",
          name: 'Sam',
          app: 'WhatsApp',
        },
      });
    });
  });

  it('opens sign-in stub', async () => {
    const { getByText } = render(<SetupScreen />);

    fireEvent.press(getByText('Sign in to sync your rewrites'));

    expect(router.push).toHaveBeenCalledWith('/auth/sign-in');
  });
});
