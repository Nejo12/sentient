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
      json: async () => ({ blocked: true }),
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
  });

  it('parses interpretations and enriched reply options on success', async () => {
    const interpretations = [
      {
        title: 'They may be seeking reassurance',
        confidence: 'high' as const,
        explanation: 'The wording leaves the decision open but sounds emotionally loaded.',
      },
      {
        title: 'They may feel unheard',
        confidence: 'medium' as const,
        explanation: 'The abrupt phrasing could reflect frustration with the discussion.',
      },
      {
        title: 'They may mean it literally',
        confidence: 'low' as const,
        explanation: 'There is not enough context to rule out a neutral reading.',
      },
    ];
    const options = [
      {
        label: 'Option 1',
        tag: 'calm',
        text: 'I do care what you think. Can we slow down and clarify this?',
        recommended: true,
        rationale: 'It reassures first, then asks for clarity without assuming intent.',
        understandingScore: 88,
        risks: [],
      },
      {
        label: 'Option 2',
        tag: 'direct',
        text: 'I am not comfortable deciding this while we are frustrated.',
        recommended: false,
        rationale: 'It sets a boundary while keeping the focus on the decision.',
        understandingScore: 78,
        risks: ['May feel firm if they wanted reassurance.'],
      },
      {
        label: 'Option 3',
        tag: 'brief',
        text: 'I would rather understand what you want before I decide.',
        recommended: false,
        rationale: 'It asks for clarity in a concise way.',
        understandingScore: 82,
        risks: ['Could sound emotionally distant.'],
      },
    ];

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ interpretations, options }),
    });

    const result = await fetchRewrites({
      capturedMessage: 'Fine. Do whatever you want.',
      intent: 'missing',
    });

    expect(result).toEqual({
      success: true,
      perspective:
        'They may be seeking reassurance (high confidence) — The wording leaves the decision open but sounds emotionally loaded.\n\nThey may feel unheard (medium confidence) — The abrupt phrasing could reflect frustration with the discussion.\n\nThey may mean it literally (low confidence) — There is not enough context to rule out a neutral reading.',
      interpretations,
      options,
    });
  });

  it('sends the authenticated request body', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ interpretations: [], options: [] }),
    });

    await fetchRewrites({
      capturedMessage: 'test',
      intent: 'do',
      understanding: 'calm',
    });

    expect(global.fetch).toHaveBeenCalledWith(
      `${SUPABASE_URL}/functions/v1/rewrite`,
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          apikey: 'test-anon-key',
          Authorization: 'Bearer test-user-token',
        }),
      }),
    );
  });

  it('returns a clear message when the server safety limit is reached', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 429 });

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
