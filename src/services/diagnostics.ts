import * as Application from 'expo-application';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { FREE_DAILY_LIMIT, getDailyRewriteCount, isPro, refreshProStatus } from './entitlements';
import { ensureSupabaseSession, isSupabaseConfigured } from './supabase';

export type DiagnosticState = 'ok' | 'warning' | 'error';

export interface DiagnosticCheck {
  id: string;
  label: string;
  state: DiagnosticState;
  detail: string;
  latencyMs?: number;
}

export interface DiagnosticReport {
  generatedAt: string;
  appVersion: string;
  buildVersion: string;
  platform: string;
  environment: string;
  checks: DiagnosticCheck[];
}

function rewriteUrl(): string | null {
  const baseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
  return baseUrl ? `${baseUrl}/functions/v1/rewrite` : null;
}

function apiKeyHeader(): Record<string, string> {
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  return anonKey ? { apikey: anonKey } : {};
}

async function runEdgeDiagnostic(accessToken: string): Promise<DiagnosticCheck[]> {
  const url = rewriteUrl();
  if (!url) {
    return [{ id: 'edge', label: 'Rewrite endpoint', state: 'error', detail: 'Supabase URL is not configured.' }];
  }

  const started = Date.now();
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...apiKeyHeader(),
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ mode: 'diagnostics' }),
    });
    const latencyMs = Date.now() - started;
    const data = (await response.json()) as {
      ok?: boolean;
      version?: string;
      model?: string;
      openai?: { state?: string; detail?: string };
      error?: string;
    };

    const edge: DiagnosticCheck = {
      id: 'edge',
      label: 'Rewrite endpoint',
      state: response.ok ? 'ok' : 'error',
      detail: response.ok ? `${data.version ?? 'unknown version'} · ${latencyMs} ms` : data.error ?? `HTTP ${response.status}`,
      latencyMs,
    };
    const openaiState = data.openai?.state;
    const openai: DiagnosticCheck = {
      id: 'openai',
      label: 'OpenAI',
      state: openaiState === 'ok' ? 'ok' : openaiState === 'rate_limited' ? 'warning' : 'error',
      detail: data.openai?.detail ?? (response.ok ? `Model ${data.model ?? 'unknown'}` : 'Unavailable'),
    };
    return [edge, openai];
  } catch (error) {
    return [{
      id: 'edge',
      label: 'Rewrite endpoint',
      state: 'error',
      detail: error instanceof Error ? error.message : 'Network request failed.',
      latencyMs: Date.now() - started,
    }];
  }
}

export async function runDiagnostics(): Promise<DiagnosticReport> {
  const checks: DiagnosticCheck[] = [];
  checks.push({
    id: 'config',
    label: 'App configuration',
    state: isSupabaseConfigured() ? 'ok' : 'error',
    detail: isSupabaseConfigured() ? 'Supabase URL and anonymous key are configured.' : 'Supabase configuration is missing.',
  });

  const session = await ensureSupabaseSession();
  checks.push({
    id: 'auth',
    label: 'Supabase session',
    state: session?.access_token ? 'ok' : 'error',
    detail: session?.user?.is_anonymous ? 'Anonymous session is valid.' : session?.user?.email ? `Signed in as ${session.user.email}.` : 'No valid session.',
  });

  if (session?.access_token) {
    checks.push(...(await runEdgeDiagnostic(session.access_token)));
  }

  await refreshProStatus();
  checks.push({
    id: 'revenuecat',
    label: 'RevenueCat',
    state: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY ? 'ok' : 'warning',
    detail: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY ? (isPro() ? 'Configured · Pro entitlement active.' : 'Configured · Free entitlement.') : 'API key is not configured.',
  });

  const count = await getDailyRewriteCount();
  checks.push({
    id: 'quota',
    label: 'Local free usage',
    state: count >= FREE_DAILY_LIMIT ? 'warning' : 'ok',
    detail: `${count} / ${FREE_DAILY_LIMIT} rewrites used today.`,
  });

  return {
    generatedAt: new Date().toISOString(),
    appVersion: Application.nativeApplicationVersion ?? Constants.expoConfig?.version ?? 'unknown',
    buildVersion: Application.nativeBuildVersion ?? 'development',
    platform: `${Platform.OS} ${Platform.Version}`,
    environment: __DEV__ ? 'Development' : 'Internal build',
    checks,
  };
}

export function formatDiagnosticReport(report: DiagnosticReport): string {
  const lines = [
    'Sentient diagnostics',
    `Generated: ${report.generatedAt}`,
    `Version: ${report.appVersion} (${report.buildVersion})`,
    `Platform: ${report.platform}`,
    `Environment: ${report.environment}`,
    '',
    ...report.checks.map((check) => `${check.state.toUpperCase()} · ${check.label}: ${check.detail}`),
  ];
  return lines.join('\n');
}
