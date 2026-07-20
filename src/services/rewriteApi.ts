import { strings } from '../constants/strings';
import type {
  CommunicationAnalysis,
  Intent,
  RewriteOption,
  Understanding,
} from '../types/rewrite';
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
  /** Compatibility aliases for the current screens during the contract migration. */
  perspective: string;
  options: RewriteOption[];
};

export type FetchRewritesFailure = {
  success: false;
  blocked?: boolean;
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

function formatAnalysis(analysis: CommunicationAnalysis): string {
  const meanings = analysis.possibleMeanings
    .map((item) => `${item.title} (${item.confidence}) — ${item.explanation}`)
    .join('\n\n');
  const unknowns = analysis.whatWeCannotKnow.map((item) => `• ${item}`).join('\n');
  const cautions = analysis.watchOutFor.map((item) => `• ${item}`).join('\n');

  return [
    meanings && `What may be happening\n${meanings}`,
    unknowns && `What we cannot know from this message\n${unknowns}`,
    cautions && `Before you reply\n${cautions}`,
  ]
    .filter(Boolean)
    .join('\n\n');
}

export async function fetchRewrites(params: FetchRewritesParams): Promise<FetchRewritesResult> {
  try {
    const session = await ensureSupabaseSession();
    if (!session?.access_token) {
      return { success: false, message: 'Sentient could not start a secure session. Please try again.' };
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

    if (response.status === 401) {
      return { success: false, message: 'Your secure session expired. Please try again.' };
    }
    if (response.status === 429) {
      return { success: false, message: 'You have reached today’s safety limit. Please try again tomorrow.' };
    }
    if (response.status === 422) {
      const data = (await response.json()) as { blocked?: boolean };
      if (data.blocked) {
        return { success: false, blocked: true, message: strings.errors.moderation };
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
      analysis: CommunicationAnalysis;
      responses: RewriteOption[];
    };
    const perspective = formatAnalysis(data.analysis);

    return {
      success: true,
      analysis: data.analysis,
      responses: data.responses,
      perspective,
      options: data.responses,
    };
  } catch {
    return { success: false, message: strings.errors.network };
  }
}
