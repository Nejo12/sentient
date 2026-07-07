jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('react-native-purchases', () => ({
  __esModule: true,
  default: {
    configure: jest.fn().mockResolvedValue(undefined),
    getCustomerInfo: jest.fn(),
  },
  LOG_LEVEL: { DEBUG: 'DEBUG' },
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import Purchases from 'react-native-purchases';

import {
  FREE_DAILY_LIMIT,
  REWRITE_COUNT_STORAGE_KEY,
  canRewrite,
  getDailyRewriteCount,
  incrementRewriteCount,
  isPro,
  refreshProStatus,
  resetEntitlementsForTests,
} from '../src/services/entitlements';

const PurchasesMock = Purchases as jest.Mocked<typeof Purchases>;

describe('entitlements', () => {
  const originalApiKey = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY;

  beforeEach(async () => {
    await AsyncStorage.clear();
    resetEntitlementsForTests();
    jest.clearAllMocks();
    delete process.env.EXPO_PUBLIC_REVENUECAT_API_KEY;
    PurchasesMock.getCustomerInfo.mockResolvedValue({
      entitlements: { active: {} },
    } as Awaited<ReturnType<typeof Purchases.getCustomerInfo>>);
  });

  afterAll(() => {
    if (originalApiKey === undefined) {
      delete process.env.EXPO_PUBLIC_REVENUECAT_API_KEY;
    } else {
      process.env.EXPO_PUBLIC_REVENUECAT_API_KEY = originalApiKey;
    }
  });

  it('allows rewrites under the daily free limit', async () => {
    await AsyncStorage.setItem(
      REWRITE_COUNT_STORAGE_KEY,
      JSON.stringify({ date: new Date().toISOString().slice(0, 10), count: 4 }),
    );

    await expect(canRewrite()).resolves.toBe(true);
  });

  it('blocks rewrites at the daily free limit', async () => {
    await AsyncStorage.setItem(
      REWRITE_COUNT_STORAGE_KEY,
      JSON.stringify({ date: new Date().toISOString().slice(0, 10), count: FREE_DAILY_LIMIT }),
    );

    await expect(canRewrite()).resolves.toBe(false);
  });

  it('resets the count on a new local day', async () => {
    await AsyncStorage.setItem(
      REWRITE_COUNT_STORAGE_KEY,
      JSON.stringify({ date: '2000-01-01', count: FREE_DAILY_LIMIT }),
    );

    await expect(canRewrite()).resolves.toBe(true);
    await expect(getDailyRewriteCount()).resolves.toBe(0);
  });

  it('increments the daily rewrite count', async () => {
    await incrementRewriteCount();
    await incrementRewriteCount();

    await expect(getDailyRewriteCount()).resolves.toBe(2);
  });

  it('returns false for isPro when RevenueCat is not configured', () => {
    expect(isPro()).toBe(false);
  });

  it('returns true for isPro when an active entitlement exists', async () => {
    process.env.EXPO_PUBLIC_REVENUECAT_API_KEY = 'test-key';
    PurchasesMock.getCustomerInfo.mockResolvedValue({
      entitlements: { active: { 'Sentient Pro': { identifier: 'Sentient Pro' } } },
    } as Awaited<ReturnType<typeof Purchases.getCustomerInfo>>);

    await refreshProStatus();

    expect(isPro()).toBe(true);
    await expect(canRewrite()).resolves.toBe(true);
  });

  it('allows unlimited rewrites for Pro users even at the limit', async () => {
    process.env.EXPO_PUBLIC_REVENUECAT_API_KEY = 'test-key';
    PurchasesMock.getCustomerInfo.mockResolvedValue({
      entitlements: { active: { 'Sentient Pro': { identifier: 'Sentient Pro' } } },
    } as Awaited<ReturnType<typeof Purchases.getCustomerInfo>>);

    await AsyncStorage.setItem(
      REWRITE_COUNT_STORAGE_KEY,
      JSON.stringify({ date: new Date().toISOString().slice(0, 10), count: FREE_DAILY_LIMIT }),
    );

    await refreshProStatus();

    await expect(canRewrite()).resolves.toBe(true);
  });
});
