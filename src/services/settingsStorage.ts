import AsyncStorage from '@react-native-async-storage/async-storage';

import { UNDERSTANDING_OPTIONS } from '../constants/understanding';
import type { Understanding } from '../types/rewrite';

export const SETTINGS_STORAGE_KEY = 'sentient:settings';

export type StoredSettings = {
  defaultUnderstanding: Understanding;
  editBeforeSend: boolean;
  saveHistory: boolean;
};

export const DEFAULT_SETTINGS: StoredSettings = {
  defaultUnderstanding: 'calm',
  editBeforeSend: true,
  saveHistory: true,
};

const VALID_UNDERSTANDING = new Set<string>(
  UNDERSTANDING_OPTIONS.map((option) => option.key),
);

function isUnderstanding(value: unknown): value is Understanding {
  return typeof value === 'string' && VALID_UNDERSTANDING.has(value);
}

function parseStoredSettings(raw: string): StoredSettings | null {
  try {
    const parsed = JSON.parse(raw) as Partial<StoredSettings>;
    if (!isUnderstanding(parsed.defaultUnderstanding)) {
      return null;
    }
    if (typeof parsed.editBeforeSend !== 'boolean') {
      return null;
    }
    if (typeof parsed.saveHistory !== 'boolean') {
      return null;
    }

    return {
      defaultUnderstanding: parsed.defaultUnderstanding,
      editBeforeSend: parsed.editBeforeSend,
      saveHistory: parsed.saveHistory,
    };
  } catch {
    return null;
  }
}

export async function loadStoredSettings(): Promise<StoredSettings> {
  try {
    const stored = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!stored) {
      return DEFAULT_SETTINGS;
    }

    return parseStoredSettings(stored) ?? DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveStoredSettings(settings: StoredSettings): Promise<void> {
  await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
}
