import { strings } from '../constants/strings';
import { getSupabaseClient } from './supabase';

export type DeleteAccountResult = { success: true } | { success: false; message: string };

function deleteAccountUrl(): string {
  const baseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
  if (!baseUrl) {
    throw new Error('EXPO_PUBLIC_SUPABASE_URL is not configured');
  }
  return `${baseUrl}/functions/v1/delete-account`;
}

export async function deleteAccount(): Promise<DeleteAccountResult> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { success: false, message: strings.errors.network };
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return { success: false, message: strings.errors.network };
  }

  try {
    const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    const response = await fetch(deleteAccountUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: anonKey ?? '',
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (!response.ok) {
      return { success: false, message: strings.settings.deleteAccountError };
    }

    await supabase.auth.signOut();
    return { success: true };
  } catch {
    return { success: false, message: strings.errors.network };
  }
}
