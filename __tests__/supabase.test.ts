jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const SUPABASE_URL = 'https://test.supabase.co';
const SUPABASE_ANON_KEY = 'test-anon-key';

describe('supabase client', () => {
  const originalUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const originalKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

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
    jest.resetModules();
  });

  it('returns null when env vars are missing', () => {
    delete process.env.EXPO_PUBLIC_SUPABASE_URL;
    delete process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

    const { getSupabaseClient, isSupabaseConfigured } = require('../src/services/supabase');

    expect(isSupabaseConfigured()).toBe(false);
    expect(getSupabaseClient()).toBeNull();
  });

  it('returns null when only the URL is configured', () => {
    process.env.EXPO_PUBLIC_SUPABASE_URL = SUPABASE_URL;
    delete process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

    const { getSupabaseClient, isSupabaseConfigured } = require('../src/services/supabase');

    expect(isSupabaseConfigured()).toBe(false);
    expect(getSupabaseClient()).toBeNull();
  });

  it('creates a client when env vars are set', () => {
    process.env.EXPO_PUBLIC_SUPABASE_URL = SUPABASE_URL;
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;

    const { getSupabaseClient, isSupabaseConfigured } = require('../src/services/supabase');

    expect(isSupabaseConfigured()).toBe(true);
    expect(getSupabaseClient()).not.toBeNull();
  });
});
