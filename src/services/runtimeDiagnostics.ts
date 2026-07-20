import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'sentient:runtime-diagnostics';
const MAX_EVENTS = 8;

export type RuntimeDiagnosticEvent = {
  at: string;
  kind: 'rewrite';
  status: 'success' | 'error';
  code?: string;
  latencyMs: number;
};

async function readEvents(): Promise<RuntimeDiagnosticEvent[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RuntimeDiagnosticEvent[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function recordRewriteDiagnostic(event: RuntimeDiagnosticEvent): Promise<void> {
  const events = await readEvents();
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([event, ...events].slice(0, MAX_EVENTS)));
}

export async function getRuntimeDiagnosticEvents(): Promise<RuntimeDiagnosticEvent[]> {
  return readEvents();
}
