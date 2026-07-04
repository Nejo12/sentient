import AsyncStorage from '@react-native-async-storage/async-storage';

import type { RewriteRecord, SaveRewriteInput } from '../types/history';
import type { Intent, Understanding } from '../types/rewrite';
import { getSupabaseClient, isSupabaseConfigured } from './supabase';

const LOCAL_STORAGE_KEY = 'sentient:dev-rewrites';

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

let devRewrites: RewriteRecord[] | null = null;

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

async function loadDevRewrites(): Promise<RewriteRecord[]> {
  if (devRewrites) {
    return devRewrites;
  }

  if (__DEV__ && !isSupabaseConfigured()) {
    try {
      const stored = await AsyncStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        devRewrites = JSON.parse(stored) as RewriteRecord[];
        return devRewrites;
      }
    } catch {
      // Fall back to seeded mock data.
    }

    devRewrites = [...MOCK_REWRITES];
    return devRewrites;
  }

  devRewrites = [];
  return devRewrites;
}

async function persistDevRewrites(): Promise<void> {
  if (devRewrites && __DEV__) {
    await AsyncStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(devRewrites));
  }
}

async function appendDevRewrite(input: SaveRewriteInput): Promise<void> {
  const list = await loadDevRewrites();
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

  devRewrites = [record, ...list.filter((item) => item.id !== record.id)];
  await persistDevRewrites();
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

    if (!user) {
      return __DEV__ ? loadDevRewrites() : [];
    }

    const { data, error } = await supabase
      .from('rewrites')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return (data as RewriteRow[] | null)?.map(mapRow) ?? [];
  }

  return loadDevRewrites();
}

export async function saveRewrite(input: SaveRewriteInput): Promise<void> {
  const supabase = getSupabaseClient();

  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      if (__DEV__) {
        await appendDevRewrite(input);
      }
      return;
    }

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

  if (__DEV__) {
    await appendDevRewrite(input);
  }
}

export function resetHistoryForTests(): void {
  devRewrites = null;
}
