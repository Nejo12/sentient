import { strings } from '../constants/strings';
import type {
  CommunicationAnalysis,
  Intent,
  RewriteOption,
  Understanding,
} from '../types/rewrite';
import { recordRewriteDiagnostic } from './runtimeDiagnostics';
import { ensureSupabaseSession } from './supabase';

export interface FetchRewritesParams {
  capturedMessage: string;
  roughDraft?: string | null;
  intent: Intent;
  understanding?: Understanding | null;
  contactName?: string | null;
}

export type FetchRewritesSuccess = {
  success: true;
  analysis: CommunicationAnalysis;
  responses: RewriteOption[];
  perspective: CommunicationAnalysis;
  options: RewriteOption[];
};

export type FetchRewritesFailure = {
  success: false;
  blocked?: boolean;
  code?: string;
  message: string;
};

export type FetchRewritesResult = FetchRewritesSuccess | FetchRewritesFailure;

function rewriteUrl(): string {
  const baseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
  if (!baseUrl) throw new Error('EXPO_PUBLIC_SUPABASE_URL is not configured');
  return `${baseUrl}/functions/v1/rewrite`;
}

function apiKeyHeader(): Record<string, string> {
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  return anonKey ? { apikey: anonKey } : {};
}

function messageForCode(code?: string, fallback?: string): string {
  switch (code) {
    case 'OPENAI_INVALID_KEY':
      return 'Sentient is temporarily unavailable because its AI connection is misconfigured.';
    case 'OPENAI_BILLING_LIMIT':
      return 'Sentient has temporarily reached its AI service budget.';
    case 'OPENAI_RATE_LIMIT':
      return 'Sentient is receiving too many requests right now. Please wait briefly and try again.';
    case 'OPENAI_TIMEOUT':
      return 'The response took too long. Please try again.';
    case 'INVALID_MODEL_RESPONSE':
      return 'Sentient could not prepare reliable options. Please try once more.';
    case 'SAFETY_QUOTA_EXCEEDED':
      return 'You have reached today’s safety limit. Please try again tomorrow.';
    case 'SUPABASE_AUTH_FAILED':
      return 'Your secure session expired. Please try again.';
    default:
      return fallback || 'Something went wrong.';
  }
}

function fallbackCodeForStatus(status: number): string | undefined {
  if (status === 401) return 'SUPABASE_AUTH_FAILED';
  if (status === 429) return 'SAFETY_QUOTA_EXCEEDED';
  return undefined;
}

export async function fetchRewrites(params: FetchRewritesParams): Promise<FetchRewritesResult> {
  const started = Date.now();
  const finish = async <T extends FetchRewritesResult>(result: T): Promise<T> => {
    await recordRewriteDiagnostic({
      at: new Date().toISOString(),
      kind: 'rewrite',
      status: result.success ? 'success' : 'error',
      code: result.success ? undefined : result.code,
      latencyMs: Date.now() - started,
    });
    return result;
  };

  try {
    const session = await ensureSupabaseSession();
    if (!session?.access_token) {
      return finish({
        success: false,
        code: 'SUPABASE_AUTH_FAILED',
        message: 'Sentient could not start a secure session. Please try again.',
      });
    }

    const response = await fetch(rewriteUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...apiKeyHeader(),
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        capturedMessage: params.capturedMessage,
        roughDraft: params.roughDraft ?? null,
        intent: params.intent,
        understanding: params.understanding ?? null,
        contactName: params.contactName ?? null,
      }),
    });

    if (response.status === 422) {
      const data = (await response.json()) as { blocked?: boolean; code?: string };
      if (data.blocked) {
        return finish({
          success: false,
          blocked: true,
          code: data.code,
          message: strings.errors.moderation,
        });
      }
    }

    if (!response.ok) {
      const statusCode = fallbackCodeForStatus(response.status);

      try {
        const data = (await response.json()) as {
          code?: string;
          message?: string;
          error?: string;
        };
        const code = data.code ?? statusCode;
        const fallback =
          typeof data.message === 'string'
            ? data.message
            : typeof data.error === 'string'
              ? data.error
              : undefined;

        return finish({
          success: false,
          code,
          message: messageForCode(code, fallback),
        });
      } catch {
        return finish({
          success: false,
          code: statusCode,
          message: statusCode
            ? messageForCode(statusCode)
            : `Sentient could not complete the request (HTTP ${response.status}).`,
        });
      }
    }

    const data = (await response.json()) as {
      analysis: CommunicationAnalysis;
      responses: RewriteOption[];
    };

    return finish({
      success: true,
      analysis: data.analysis,
      responses: data.responses,
      perspective: data.analysis,
      options: data.responses,
    });
  } catch {
    return finish({
      success: false,
      code: 'NETWORK_ERROR',
      message: strings.errors.network,
    });
  }
}
