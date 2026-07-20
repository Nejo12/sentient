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

  it('parses structured analysis and responses while exposing screen aliases', async () => {
    const analysis = {
      possibleMeanings: [
        {
          title: 'They may be seeking reassurance',
          confidence: 'high' as const,
          explanation: 'The wording sounds emotionally loaded.',
        },
        {
          title: 'They may feel unheard',
          confidence: 'medium' as const,
          explanation: 'The abrupt phrasing could reflect frustration.',
        },
        {
          title: 'They may mean it literally',
          confidence: 'low' as const,
          explanation: 'A neutral reading cannot be ruled out.',
        },
      ],
      whatWeCannotKnow: ['Whether they are upset or simply ending the discussion.'],
      watchOutFor: ['Do not answer the implied emotion as though it were certain.'],
    };
    const responses = [
      {
        label: 'Option 1',
        tag: 'calm',
        text: 'I do care what you think. Can we clarify this?',
        recommended: true,
        rationale: 'It reassures first and asks for clarity.',
        understandingScore: 88,
        risks: [],
      },
      {
        label: 'Option 2',
        tag: 'direct',
        text: 'I am not comfortable deciding this while we are frustrated.',
        recommended: false,
        rationale: 'It sets a boundary without assigning motive.',
        understandingScore: 78,
        risks: ['May feel firm if reassurance was wanted.'],
      },
      {
        label: 'Option 3',
        tag: 'brief',
        text: 'I would rather understand what you want before I decide.',
        recommended: false,
        rationale: 'It asks for clarity concisely.',
        understandingScore: 82,
        risks: ['Could sound emotionally distant.'],
      },
    ];

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ analysis, responses }),
    });

    const result = await fetchRewrites({
      capturedMessage: 'Fine. Do whatever you want.',
      intent: 'missing',
    });

    expect(result).toEqual({
      success: true,
      analysis,
      responses,
      options: responses,
      perspective: analysis,
    });
  });

  it('sends the authenticated request body', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        analysis: { possibleMeanings: [], whatWeCannotKnow: [], watchOutFor: [] },
        responses: [],
      }),
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
      code: 'SAFETY_QUOTA_EXCEEDED',
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
      code: 'NETWORK_ERROR',
      message: strings.errors.network,
    });
  });
});
