import { fireEvent, render } from '@testing-library/react-native';

import HomeScreen from '../app/(tabs)/index';
import { strings } from '../src/constants/strings';
import { useSessionStore } from '../src/store/sessionStore';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn() },
}));

const { router } = jest.requireMock('expo-router') as {
  router: { push: jest.Mock; replace: jest.Mock };
};

describe('home screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useSessionStore.getState().reset();
  });

  it('opens Choose with no pre-filled message — not the old demo data', () => {
    const { getByText } = render(<HomeScreen />);

    fireEvent.press(getByText(strings.home.cta));

    // Regression guard: this must never carry the "Sam / WhatsApp" demo
    // params that used to ship to every build, not just __DEV__.
    expect(router.push).toHaveBeenCalledWith('/(flow)/choose');
    expect(router.push).not.toHaveBeenCalledWith(
      expect.objectContaining({
        params: expect.objectContaining({ name: 'Sam' }),
      }),
    );
  });

  it('clears any leftover session state before opening Choose', () => {
    useSessionStore.getState().setCapturedContext('Old leftover message', 'Alex', 'WhatsApp');

    const { getByText } = render(<HomeScreen />);
    fireEvent.press(getByText(strings.home.cta));

    expect(useSessionStore.getState().capturedMessage).toBe('');
    expect(useSessionStore.getState().contactName).toBe('');
  });
});
