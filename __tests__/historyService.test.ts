jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  formatRewriteTime,
  getRewriteTitle,
  listRewrites,
  resetHistoryForTests,
  saveRewrite,
} from '../src/services/historyService';
import { resetSupabaseClientForTests } from '../src/services/supabase';

describe('historyService', () => {
  const originalUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const originalKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  beforeEach(async () => {
    delete process.env.EXPO_PUBLIC_SUPABASE_URL;
    delete process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    resetSupabaseClientForTests();
    resetHistoryForTests();
    await AsyncStorage.clear();
    jest.resetModules();
  });

  afterEach(() => {
    if (originalUrl === undefined) {
      delete process.env.EXPO_PUBLIC_SUPABASE_URL;
    } else {
      process.env.EXPO_PUBLIC_SUPABASE_URL = originalUrl;
    }
    if (originalKey === undefined) {
      delete process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    } else {
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = originalKey;
    }
    resetSupabaseClientForTests();
    resetHistoryForTests();
  });

  it('formats recent rewrites as hours', () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    expect(formatRewriteTime(twoHoursAgo)).toBe('2h');
  });

  it('builds reply titles from contact names', () => {
    expect(
      getRewriteTitle({
        id: '1',
        contactName: 'Sam',
        sourceApp: 'WhatsApp',
        intent: 'do',
        understanding: 'calm',
        snippet: 'Hello',
        fullText: 'Hello there',
        createdAt: new Date().toISOString(),
      }),
    ).toBe('Reply to Sam');
  });

  it('returns seeded mock rewrites in dev when Supabase is not configured', async () => {
    const {
      listRewrites: listRewritesFresh,
      resetHistoryForTests: resetHistory,
    } = require('../src/services/historyService');

    resetHistory();
    const records = await listRewritesFresh();

    expect(records.length).toBeGreaterThanOrEqual(5);
    expect(records[0]?.contactName).toBeTruthy();
  });

  it('appends saved rewrites to local dev storage', async () => {
    const {
      listRewrites: listRewritesFresh,
      saveRewrite: saveRewriteFresh,
      resetHistoryForTests: resetHistory,
    } = require('../src/services/historyService');

    resetHistory();

    await saveRewriteFresh({
      contactName: 'Alex',
      sourceApp: 'WhatsApp',
      intent: 'do',
      understanding: 'calm',
      fullText: 'Thanks for checking in — I can talk tonight.',
    });

    const records = await listRewritesFresh();
    expect(records[0]?.contactName).toBe('Alex');
    expect(records[0]?.snippet).toContain('Thanks for checking in');
  });
});
