jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

import { fireEvent, render, waitFor } from '@testing-library/react-native';

import YouScreen from '../app/(tabs)/you';
import { strings } from '../src/constants/strings';
import { isPro, presentPaywall } from '../src/services/entitlements';
import { useSettingsStore } from '../src/store/settingsStore';

jest.mock('../src/services/settingsService', () => ({
  fetchRemoteSettings: jest.fn().mockResolvedValue(null),
  syncSettingsToRemote: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../src/services/entitlements', () => ({
  isPro: jest.fn().mockReturnValue(false),
  presentPaywall: jest.fn().mockResolvedValue(undefined),
  refreshProStatus: jest.fn().mockResolvedValue(undefined),
}));

describe('settings screen', () => {
  beforeEach(() => {
    useSettingsStore.getState().resetForTests();
    jest.clearAllMocks();
  });

  it('renders defaults, toggles, and pro card', async () => {
    const { getByText } = render(<YouScreen />);

    await waitFor(() => {
      expect(getByText(strings.settings.title)).toBeTruthy();
    });

    expect(getByText(strings.settings.defaults)).toBeTruthy();
    expect(getByText(strings.settings.defaultUnderstanding)).toBeTruthy();
    expect(getByText(strings.settings.beforeAnythingSends)).toBeTruthy();
    expect(getByText(strings.settings.editBeforeSend)).toBeTruthy();
    expect(getByText(strings.settings.saveHistory)).toBeTruthy();
    expect(getByText(strings.settings.proTitle)).toBeTruthy();
    expect(getByText(strings.settings.proBody)).toBeTruthy();
    expect(getByText(strings.settings.proCta)).toBeTruthy();
    expect(getByText(strings.settings.proPrice)).toBeTruthy();
  });

  it('updates save history toggle', async () => {
    await useSettingsStore.getState().hydrate();
    const { getByLabelText } = render(<YouScreen />);

    fireEvent.press(getByLabelText(strings.settings.saveHistory));

    await waitFor(() => {
      expect(useSettingsStore.getState().saveHistory).toBe(false);
    });
  });

  it('opens understanding picker and selects an option', async () => {
    await useSettingsStore.getState().hydrate();
    const { getByLabelText, getByText } = render(<YouScreen />);

    fireEvent.press(getByLabelText(strings.settings.defaultUnderstanding));

    expect(getByText('Confident')).toBeTruthy();

    fireEvent.press(getByText('Confident'));

    await waitFor(() => {
      expect(useSettingsStore.getState().defaultUnderstanding).toBe('confident');
    });
  });

  it('calls presentPaywall for Go Pro', async () => {
    const { getByText } = render(<YouScreen />);

    await waitFor(() => {
      expect(getByText(strings.settings.proCta)).toBeTruthy();
    });

    fireEvent.press(getByText(strings.settings.proCta));

    expect(presentPaywall).toHaveBeenCalled();
  });

  it('hides the Go Pro cta and shows the active-Pro copy once entitled', async () => {
    (isPro as jest.Mock).mockReturnValue(true);

    const { getByText, queryByText } = render(<YouScreen />);

    await waitFor(() => {
      expect(getByText(strings.settings.proActiveBody)).toBeTruthy();
    });

    expect(queryByText(strings.settings.proCta)).toBeNull();
  });
});
