import AsyncStorage from '@react-native-async-storage/async-storage';

import type { RewriteRecord, SaveRewriteInput } from '../types/history';
import type { Intent, Understanding } from '../types/rewrite';
import { getSupabaseClient } from './supabase';

const LOCAL_STORAGE_KEY = 'sentient:local-rewrites';

const MOCK_REWRITES: RewriteRecord[] = [
  {
    id: 'mock-sam',
    contactName: 'Sam',
    sourceApp: 'WhatsApp',
    intent: 'do',
    understanding: 'compassionate',
    snippet:
      "I'm really sorry — I hate that this keeps landing on you when work blows up.",
    fullText:
      "I'm really sorry — I hate that this keeps landing on you when work blows up. I want us to reset properly.",
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'mock-mum',
    contactName: 'Mum',
    sourceApp: 'Messages',
    intent: 'do',
    understanding: 'confident',
    snippet: 'I can make Thursday work — shall we lock in a time that suits you?',
    fullText:
      'I can make Thursday work — shall we lock in a time that suits you? I want to be clear about what I can offer.',
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'mock-landlord',
    contactName: 'Landlord',
    sourceApp: 'Email',
    intent: 'do',
    understanding: 'firm',
    snippet: 'Thanks for the update on the deposit — could you confirm the timeline in writing?',
    fullText:
      'Thanks for the update on the deposit — could you confirm the timeline in writing? I want to make sure we are aligned.',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'mock-priya',
    contactName: 'Priya',
    sourceApp: 'WhatsApp',
    intent: 'do',
    understanding: 'calm',
    snippet: 'Thank you for stepping in yesterday — it meant a lot that you made time.',
    fullText:
      'Thank you for stepping in yesterday — it meant a lot that you made time. I appreciate how steady you were.',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'mock-jonas',
    contactName: 'Jonas',
    sourceApp: 'Messenger',
    intent: 'missing',
    understanding: null,
    snippet: 'It sounds like the deadline moved — I want to check what still works for you.',
    fullText:
      'It sounds like the deadline moved — I want to check what still works for you before I reply.',
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

let localRewrites: RewriteRecord[] | null = null;

type RewriteRow = {
  id: string;
  contact_name: string | null;
  source_app: string | null;
  intent: string;
  understanding: string | null;
  snippet: string;
  full_text: string;
  created_at: string;
};

function createId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function makeSnippet(text: string): string {
  const trimmed = text.trim();
  if (trimmed.length <= 80) {
    return trimmed;
  }
  return `${trimmed.slice(0, 77)}...`;
}

function mapRow(row: RewriteRow): RewriteRecord {
  return {
    id: row.id,
    contactName: row.contact_name ?? '',
    sourceApp: row.source_app ?? '',
    intent: row.intent as Intent,
    understanding: (row.understanding as Understanding | null) ?? null,
    snippet: row.snippet,
    fullText: row.full_text,
    createdAt: row.created_at,
  };
}

// The in-memory cache holds only genuinely persisted local rewrites — MOCK_REWRITES
// is never written here, so it can never be appended to, persisted, or migrated
// to an account by mistake. It exists purely as a display fallback in listRewrites().
async function readPersistedLocalRewrites(): Promise<RewriteRecord[]> {
  if (localRewrites) {
    return localRewrites;
  }

  try {
    const stored = await AsyncStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) {
      localRewrites = JSON.parse(stored) as RewriteRecord[];
      return localRewrites;
    }
  } catch {
    // Fall through to empty below.
  }

  localRewrites = [];
  return localRewrites;
}

async function persistLocalRewrites(): Promise<void> {
  if (localRewrites) {
    await AsyncStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(localRewrites));
  }
}

async function appendLocalRewrite(input: SaveRewriteInput): Promise<void> {
  const list = await readPersistedLocalRewrites();
  const record: RewriteRecord = {
    id: createId(),
    contactName: input.contactName,
    sourceApp: input.sourceApp,
    intent: input.intent,
    understanding: input.understanding,
    snippet: makeSnippet(input.fullText),
    fullText: input.fullText,
    createdAt: new Date().toISOString(),
  };

  localRewrites = [record, ...list.filter((item) => item.id !== record.id)];
  await persistLocalRewrites();
}

export function getRewriteTitle(record: RewriteRecord): string {
  const name = record.contactName.trim();
  if (!name) {
    return 'Rewrite';
  }

  return record.intent === 'do' ? `Reply to ${name}` : `Message to ${name}`;
}

export function formatRewriteTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffHours < 24) {
    return diffHours <= 0 ? 'Now' : `${diffHours}h`;
  }

  return date.toLocaleDateString('en-GB', { weekday: 'short' });
}

export function getRewriteSectionLabel(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);

  if (date >= startOfToday) {
    return 'Today';
  }

  if (date >= startOfYesterday) {
    return 'Yesterday';
  }

  return date.toLocaleDateString('en-GB', { month: 'long', day: 'numeric' });
}

export async function listRewrites(): Promise<RewriteRecord[]> {
  const supabase = getSupabaseClient();

  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data, error } = await supabase
        .from('rewrites')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return (data as RewriteRow[] | null)?.map(mapRow) ?? [];
    }
  }

  const persisted = await readPersistedLocalRewrites();
  if (persisted.length > 0 || !__DEV__) {
    return persisted;
  }

  // Nothing saved locally yet in dev — show sample data for preview only.
  // Never cached or persisted, so it can't be appended to or migrated later.
  return MOCK_REWRITES;
}

export async function saveRewrite(input: SaveRewriteInput): Promise<void> {
  const supabase = getSupabaseClient();

  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { error } = await supabase.from('rewrites').insert({
        user_id: user.id,
        contact_name: input.contactName || null,
        source_app: input.sourceApp || null,
        intent: input.intent,
        understanding: input.understanding,
        snippet: makeSnippet(input.fullText),
        full_text: input.fullText,
      });

      if (error) {
        throw error;
      }

      return;
    }
  }

  await appendLocalRewrite(input);
}

/** Upload any locally-stored rewrites to the now-authenticated account, then clear the local copy. */
export async function migrateLocalRewritesToAccount(): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return;
  }

  const local = await readPersistedLocalRewrites();
  if (local.length === 0) {
    return;
  }

  const { error } = await supabase.from('rewrites').insert(
    local.map((record) => ({
      user_id: user.id,
      contact_name: record.contactName || null,
      source_app: record.sourceApp || null,
      intent: record.intent,
      understanding: record.understanding,
      snippet: record.snippet,
      full_text: record.fullText,
      created_at: record.createdAt,
    })),
  );

  if (error) {
    throw error;
  }

  localRewrites = [];
  await AsyncStorage.removeItem(LOCAL_STORAGE_KEY);
}

export function resetHistoryForTests(): void {
  localRewrites = null;
}
