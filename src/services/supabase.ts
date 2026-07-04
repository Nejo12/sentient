import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

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

export function resetSupabaseClientForTests(): void {
  client = undefined;
}
