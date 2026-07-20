import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createClient,
  type Session,
  type SupabaseClient,
} from '@supabase/supabase-js';

export type { SupabaseClient };

let client: SupabaseClient | null | undefined;

function readSupabaseEnv(): { url: string; anonKey: string } | null {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return null;
  }
  return { url, anonKey };
}

export function isSupabaseConfigured(): boolean {
  return readSupabaseEnv() !== null;
}

export function createSupabaseClient(): SupabaseClient | null {
  const env = readSupabaseEnv();
  if (!env) {
    return null;
  }

  return createClient(env.url, env.anonKey, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
}

export function getSupabaseClient(): SupabaseClient | null {
  if (client === undefined) {
    client = createSupabaseClient();
  }
  return client;
}

/**
 * Return a valid Supabase session for protected backend calls.
 *
 * Sentient allows users to try the core flow before creating a named account,
 * so a missing session is upgraded to an anonymous Supabase user. Anonymous
 * sign-ins must be enabled in the Supabase Auth dashboard.
 */
export async function ensureSupabaseSession(): Promise<Session | null> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return null;
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.access_token) {
    return session;
  }

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) {
    console.warn('[supabase] anonymous sign-in failed', error.message);
    return null;
  }

  return data.session;
}

export function resetSupabaseClientForTests(): void {
  client = undefined;
}
