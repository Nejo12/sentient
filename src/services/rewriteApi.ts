import { strings } from '../constants/strings';
import type { Intent, RewriteOption, Understanding } from '../types/rewrite';

export interface FetchRewritesParams {
  capturedMessage: string;
  roughDraft?: string | null;
  intent: Intent;
  understanding?: Understanding | null;
  contactName?: string | null;
}

export type FetchRewritesSuccess = {
  success: true;
  perspective: string | null;
  options: RewriteOption[];
};

export type FetchRewritesFailure = {
  success: false;
  blocked?: boolean;
  message: string;
};

export type FetchRewritesResult = FetchRewritesSuccess | FetchRewritesFailure;

function rewriteUrl(): string {
  const baseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  if (!baseUrl) {
    throw new Error('EXPO_PUBLIC_SUPABASE_URL is not configured');
  }
  return `${baseUrl}/functions/v1/rewrite`;
}

export async function fetchRewrites(
  params: FetchRewritesParams,
): Promise<FetchRewritesResult> {
  try {
    const response = await fetch(rewriteUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        capturedMessage: params.capturedMessage,
        roughDraft: params.roughDraft ?? null,
        intent: params.intent,
        understanding: params.understanding ?? null,
        contactName: params.contactName ?? null,
      }),
    });

    if (response.status === 422) {
      const data = (await response.json()) as { blocked?: boolean };
      if (data.blocked) {
        return {
          success: false,
          blocked: true,
          message: strings.errors.moderation,
        };
      }
    }

    if (!response.ok) {
      try {
        const data = (await response.json()) as { message?: string; error?: string };
        return {
          success: false,
          message:
            typeof data.message === 'string'
              ? data.message
              : typeof data.error === 'string'
                ? data.error
                : 'Something went wrong.',
        };
      } catch {
        return { success: false, message: 'Something went wrong.' };
      }
    }

    const data = (await response.json()) as {
      perspective?: string | null;
      options: RewriteOption[];
    };

    return {
      success: true,
      perspective: data.perspective ?? null,
      options: data.options,
    };
  } catch {
    return {
      success: false,
      message: strings.errors.network,
    };
  }
}
