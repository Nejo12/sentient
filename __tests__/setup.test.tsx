import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { Linking, Platform } from 'react-native';

import SetupScreen from '../app/setup';
import { strings } from '../src/constants/strings';
import {
  isOverlaySetupDone,
  isShareSetupDone,
  setOverlaySetupDone,
  setSetupComplete,
  setShareSetupDone,
} from '../src/services/setupStorage';
import {
  isOverlayPermissionGranted,
  requestOverlayPermission,
} from '../src/services/overlayPermission';

jest.mock('expo-router', () => ({
  router: { replace: jest.fn(), push: jest.fn() },
}));

jest.mock('../src/services/setupStorage', () => ({
  isShareSetupDone: jest.fn(),
  isOverlaySetupDone: jest.fn(),
  setSetupComplete: jest.fn(),
  setShareSetupDone: jest.fn(),
  setOverlaySetupDone: jest.fn(),
}));

jest.mock('../src/services/overlayPermission', () => ({
  isOverlayPermissionGranted: jest.fn(),
  requestOverlayPermission: jest.fn(),
}));

jest.mock('../src/services/bubbleService', () => ({
  startBubble: jest.fn().mockResolvedValue(undefined),
  stopBubble: jest.fn().mockResolvedValue(undefined),
}));

const { router } = jest.requireMock('expo-router') as {
  router: { replace: jest.Mock; push: jest.Mock };
};

describe('setup screen', () => {
  const originalPlatform = Platform.OS;

  beforeEach(() => {
    jest.clearAllMocks();
    Platform.OS = originalPlatform;
    (isShareSetupDone as jest.Mock).mockResolvedValue(false);
    (isOverlaySetupDone as jest.Mock).mockResolvedValue(false);
    (isOverlayPermissionGranted as jest.Mock).mockResolvedValue(false);
    (requestOverlayPermission as jest.Mock).mockResolvedValue(undefined);
    (setOverlaySetupDone as jest.Mock).mockResolvedValue(undefined);
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

  it('shows Android overlay permission row and opens overlay settings', async () => {
    Platform.OS = 'android';
    const { getByText, getByTestId } = render(<SetupScreen />);

    expect(getByText('Draw over other apps')).toBeTruthy();
    fireEvent.press(getByText('Draw over other apps'));

    await waitFor(() => {
      expect(requestOverlayPermission).toHaveBeenCalled();
    });

    (isOverlayPermissionGranted as jest.Mock).mockResolvedValue(true);
    fireEvent.press(getByText('Draw over other apps'));

    await waitFor(() => {
      expect(setOverlaySetupDone).toHaveBeenCalled();
      expect(getByTestId('overlay-done-badge')).toBeTruthy();
    });
  });

  it('hides Android overlay permission row on iOS', async () => {
    Platform.OS = 'ios';
    const { queryByText } = render(<SetupScreen />);

    expect(queryByText('Draw over other apps')).toBeNull();
  });

  it('starts the bubble once overlay permission is granted on Android', async () => {
    const { requestOverlayPermission, isOverlayPermissionGranted } = jest.requireMock(
      '../src/services/overlayPermission',
    );
    const { startBubble } = jest.requireMock('../src/services/bubbleService');
    Platform.OS = 'android';
    isOverlayPermissionGranted.mockResolvedValue(true);

    const { getByText } = render(<SetupScreen />);

    fireEvent.press(getByText(strings.setup.overlayTitle));

    await waitFor(() => {
      expect(requestOverlayPermission).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(startBubble).toHaveBeenCalled();
    });
  });
});
