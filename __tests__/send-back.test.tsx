import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { Alert, Linking } from 'react-native';

import SendBackScreen from '../app/(flow)/send-back';
import { strings } from '../src/constants/strings';
import { useSessionStore } from '../src/store/sessionStore';
import { useSettingsStore } from '../src/store/settingsStore';
import { copyToClipboard } from '../src/utils/clipboard';
import { saveRewrite } from '../src/services/historyService';

jest.mock('expo-router', () => ({
  router: {
    back: jest.fn(),
  },
}));

jest.mock('../src/utils/clipboard', () => ({
  copyToClipboard: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../src/services/historyService', () => ({
  saveRewrite: jest.fn().mockResolvedValue(undefined),
}));

const { router } = jest.requireMock('expo-router') as {
  router: { back: jest.Mock };
};

describe('send-back screen', () => {
  beforeEach(() => {
    useSessionStore.getState().reset();
    useSettingsStore.setState({ saveHistory: true });
    jest.clearAllMocks();
    useSessionStore.setState({
      intent: 'do',
      understanding: 'calm',
      sourceApp: 'WhatsApp',
      chosenReply: 'I hear you. I want to make this better.',
    });
  });

  it('copies and opens WhatsApp from primary action', async () => {
    jest.spyOn(Linking, 'canOpenURL').mockResolvedValueOnce(true);
    const openURLSpy = jest.spyOn(Linking, 'openURL').mockResolvedValueOnce();
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const { getByText } = render(<SendBackScreen />);

    fireEvent.press(getByText(strings.sendBack.copyAndSwitch('WhatsApp')));

    await waitFor(() => {
      expect(copyToClipboard).toHaveBeenCalledWith(
        'I hear you. I want to make this better.',
      );
    });

    expect(saveRewrite).toHaveBeenCalledWith(
      expect.objectContaining({
        contactName: '',
        sourceApp: 'WhatsApp',
        intent: 'do',
        understanding: 'calm',
        fullText: 'I hear you. I want to make this better.',
      }),
    );

    expect(openURLSpy).toHaveBeenCalledWith('whatsapp://');
    expect(alertSpy).not.toHaveBeenCalled();
  });

  it('shows copy toast after tapping copy', async () => {
    const { getByText } = render(<SendBackScreen />);

    fireEvent.press(getByText(strings.compare.copy));

    await waitFor(() => {
      expect(copyToClipboard).toHaveBeenCalledWith(
        'I hear you. I want to make this better.',
      );
    });

    expect(getByText(strings.sendBack.copiedToast)).toBeTruthy();
  });

  it('falls back to alert when source app is not WhatsApp', async () => {
    useSessionStore.setState({ sourceApp: 'Messages' });
    const openURLSpy = jest.spyOn(Linking, 'openURL').mockResolvedValueOnce();
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const { getByText } = render(<SendBackScreen />);

    fireEvent.press(getByText(strings.sendBack.copyAndSwitch('Messages')));

    await waitFor(() => {
      expect(copyToClipboard).toHaveBeenCalled();
    });

    expect(openURLSpy).not.toHaveBeenCalled();
    expect(alertSpy).toHaveBeenCalled();
  });

  it('edits chosen reply from pencil mode', () => {
    const { getByLabelText, getByDisplayValue, queryByDisplayValue, getByText } = render(
      <SendBackScreen />,
    );

    fireEvent.press(getByLabelText('Edit reply'));
    fireEvent.changeText(
      getByDisplayValue('I hear you. I want to make this better.'),
      'Edited response',
    );
    fireEvent.press(getByLabelText('Finish editing reply'));

    expect(queryByDisplayValue('I hear you. I want to make this better.')).toBeNull();
    expect(getByText('Edited response')).toBeTruthy();
    expect(useSessionStore.getState().chosenReply).toBe('Edited response');
  });

  it('skips history save when saveHistory is disabled', async () => {
    useSettingsStore.setState({ saveHistory: false });
    const { getByText } = render(<SendBackScreen />);

    fireEvent.press(getByText(strings.compare.copy));

    await waitFor(() => {
      expect(copyToClipboard).toHaveBeenCalled();
    });

    expect(saveRewrite).not.toHaveBeenCalled();
  });

  it('goes back to compare from ghost action', () => {
    const { getByText } = render(<SendBackScreen />);

    fireEvent.press(getByText(strings.sendBack.backToOptions));

    expect(router.back).toHaveBeenCalledTimes(1);
  });
});
