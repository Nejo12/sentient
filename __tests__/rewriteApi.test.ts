import { strings } from '../src/constants/strings';
import { fetchRewrites } from '../src/services/rewriteApi';
import { ensureSupabaseSession } from '../src/services/supabase';

jest.mock('../src/services/supabase', () => ({
  ensureSupabaseSession: jest.fn(),
}));

const SUPABASE_URL = 'https://test.supabase.co';
const mockedEnsureSupabaseSession = ensureSupabaseSession as jest.MockedFunction<
  typeof ensureSupabaseSession
>;

describe('rewriteApi', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    process.env.EXPO_PUBLIC_SUPABASE_URL = SUPABASE_URL;
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
    mockedEnsureSupabaseSession.mockResolvedValue({
      access_token: 'test-user-token',
    } as Awaited<ReturnType<typeof ensureSupabaseSession>>);
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  it('does not call the backend when a secure session cannot be created', async () => {
    mockedEnsureSupabaseSession.mockResolvedValue(null);
    global.fetch = jest.fn();

    const result = await fetchRewrites({
      capturedMessage: 'test',
      intent: 'do',
      understanding: 'calm',
    });

    expect(result.success).toBe(false);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('returns blocked message on 422', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => ({
        blocked: true,
        message: 'Something here needs another look.',
      }),
    });

    const result = await fetchRewrites({
      capturedMessage: 'test',
      intent: 'do',
      understanding: 'calm',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.blocked).toBe(true);
      expect(result.message).toBe(strings.errors.moderation);
    }

    expect(global.fetch).toHaveBeenCalledWith(
      `${SUPABASE_URL}/functions/v1/rewrite`,
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          apikey: 'test-anon-key',
          Authorization: 'Bearer test-user-token',
        }),
        body: JSON.stringify({
          capturedMessage: 'test',
          roughDraft: null,
          intent: 'do',
          understanding: 'calm',
          contactName: null,
        }),
      }),
    );
  });

  it('parses options on success', async () => {
    const options = [
      {
        label: 'Option 1',
        tag: 'direct',
        text: 'Thanks for letting me know.',
        recommended: true,
      },
      {
        label: 'Option 2',
        tag: 'warm',
        text: 'Thanks so much for the update.',
        recommended: false,
      },
      {
        label: 'Option 3',
        tag: 'brief',
        text: 'Got it, thanks.',
        recommended: false,
      },
    ];

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        perspective: 'They may feel overlooked.',
        options,
      }),
    });

    const result = await fetchRewrites({
      capturedMessage: 'Can we talk?',
      intent: 'missing',
    });

    expect(result).toEqual({
      success: true,
      perspective: 'They may feel overlooked.',
      options,
    });
  });

  it('returns a clear message when the server safety limit is reached', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 429,
    });

    const result = await fetchRewrites({
      capturedMessage: 'test',
      intent: 'do',
      understanding: 'calm',
    });

    expect(result).toEqual({
      success: false,
      message: 'You have reached today’s safety limit. Please try again tomorrow.',
    });
  });

  it('returns network error on fetch failure', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network request failed'));

    const result = await fetchRewrites({
      capturedMessage: 'test',
      intent: 'do',
      understanding: 'calm',
    });

    expect(result).toEqual({
      success: false,
      message: strings.errors.network,
    });
  });
});
