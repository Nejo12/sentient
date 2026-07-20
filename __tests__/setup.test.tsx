import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { Alert, Platform } from 'react-native';

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
  });

  it('renders welcome copy and privacy reassurance', () => {
    const { getByText } = render(<SetupScreen />);

    expect(getByText(strings.setup.welcome)).toBeTruthy();
    expect(getByText(strings.setup.shareSheetTitle)).toBeTruthy();
    expect(getByText(strings.setup.privacyReassurance)).toBeTruthy();
  });

  it('shows Share Sheet instructions and marks setup done after confirmation', async () => {
    let actions: { text?: string; onPress?: () => void }[] = [];
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((_title, _body, buttons) => {
      actions = buttons ?? [];
    });
    const { getByText, getByTestId } = render(<SetupScreen />);

    fireEvent.press(getByText(strings.setup.shareSheetTitle));

    expect(alertSpy).toHaveBeenCalledWith(
      strings.setup.shareHelpTitle,
      strings.setup.shareHelpBody,
      expect.any(Array),
    );

    actions.find((action) => action.text === strings.setup.shareHelpDone)?.onPress?.();

    await waitFor(() => {
      expect(setShareSetupDone).toHaveBeenCalled();
      expect(getByTestId('share-done-badge')).toBeTruthy();
    });
  });

  it('continues to choose flow in dev with sample params', async () => {
    const { getByText } = render(<SetupScreen />);

    fireEvent.press(getByText(strings.setup.continue));

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

  it('opens sign-in', () => {
    const { getByText } = render(<SetupScreen />);

    fireEvent.press(getByText(strings.setup.signIn));

    expect(router.push).toHaveBeenCalledWith('/auth/sign-in');
  });

  it('shows Android overlay permission row and opens overlay settings', async () => {
    Platform.OS = 'android';
    const { getByText, getByTestId } = render(<SetupScreen />);

    expect(getByText(strings.setup.overlayTitle)).toBeTruthy();
    fireEvent.press(getByText(strings.setup.overlayTitle));

    await waitFor(() => {
      expect(requestOverlayPermission).toHaveBeenCalled();
    });

    (isOverlayPermissionGranted as jest.Mock).mockResolvedValue(true);
    fireEvent.press(getByText(strings.setup.overlayTitle));

    await waitFor(() => {
      expect(setOverlaySetupDone).toHaveBeenCalled();
      expect(getByTestId('overlay-done-badge')).toBeTruthy();
    });
  });

  it('hides Android overlay permission row on iOS', () => {
    Platform.OS = 'ios';
    const { queryByText } = render(<SetupScreen />);

    expect(queryByText(strings.setup.overlayTitle)).toBeNull();
  });

  it('starts the bubble once overlay permission is granted on Android', async () => {
    const { isOverlayPermissionGranted } = jest.requireMock(
      '../src/services/overlayPermission',
    );
    const { startBubble } = jest.requireMock('../src/services/bubbleService');
    Platform.OS = 'android';
    isOverlayPermissionGranted.mockResolvedValue(true);

    const { getByText } = render(<SetupScreen />);

    fireEvent.press(getByText(strings.setup.overlayTitle));

    await waitFor(() => {
      expect(startBubble).toHaveBeenCalled();
    });
  });

  it('starts the bubble on mount when overlay permission was already granted', async () => {
    const { isOverlayPermissionGranted } = jest.requireMock(
      '../src/services/overlayPermission',
    );
    const { startBubble } = jest.requireMock('../src/services/bubbleService');
    Platform.OS = 'android';
    isOverlayPermissionGranted.mockResolvedValue(true);

    render(<SetupScreen />);

    await waitFor(() => {
      expect(startBubble).toHaveBeenCalled();
    });
  });

  it('does not start the bubble when setup was done but permission was revoked', async () => {
    const { isOverlayPermissionGranted } = jest.requireMock(
      '../src/services/overlayPermission',
    );
    const { startBubble } = jest.requireMock('../src/services/bubbleService');
    Platform.OS = 'android';
    (isOverlaySetupDone as jest.Mock).mockResolvedValue(true);
    isOverlayPermissionGranted.mockResolvedValue(false);

    const { getByTestId } = render(<SetupScreen />);

    await waitFor(() => {
      expect(getByTestId('overlay-done-badge')).toBeTruthy();
    });

    expect(startBubble).not.toHaveBeenCalled();
  });
});
