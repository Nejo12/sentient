import type { StoredSettings } from './settingsStorage';
import { DEFAULT_SETTINGS } from './settingsStorage';
import type { Understanding } from '../types/rewrite';
import { UNDERSTANDING_OPTIONS } from '../constants/understanding';
import { getSupabaseClient } from './supabase';

type SettingsRow = {
  default_understanding: string | null;
  edit_before_send: boolean | null;
  save_history: boolean | null;
};

const VALID_UNDERSTANDING = new Set<string>(
  UNDERSTANDING_OPTIONS.map((option) => option.key),
);

function mapRow(row: SettingsRow): StoredSettings {
  const defaultUnderstanding = row.default_understanding;
  const understanding =
    defaultUnderstanding && VALID_UNDERSTANDING.has(defaultUnderstanding)
      ? (defaultUnderstanding as Understanding)
      : DEFAULT_SETTINGS.defaultUnderstanding;

  return {
    defaultUnderstanding: understanding,
    editBeforeSend: row.edit_before_send ?? DEFAULT_SETTINGS.editBeforeSend,
    saveHistory: row.save_history ?? DEFAULT_SETTINGS.saveHistory,
  };
}

export async function fetchRemoteSettings(): Promise<StoredSettings | null> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return null;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from('user_settings')
    .select('default_understanding, edit_before_send, save_history')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapRow(data as SettingsRow);
}

export async function syncSettingsToRemote(settings: StoredSettings): Promise<void> {
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

  const { error } = await supabase.from('user_settings').upsert({
    user_id: user.id,
    default_understanding: settings.defaultUnderstanding,
    edit_before_send: settings.editBeforeSend,
    save_history: settings.saveHistory,
  });

  if (error) {
    throw error;
  }
}
