import * as Application from 'expo-application';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { FREE_DAILY_LIMIT, getDailyRewriteCount, isPro, refreshProStatus } from './entitlements';
import { getRuntimeDiagnosticEvents, type RuntimeDiagnosticEvent } from './runtimeDiagnostics';
import { ensureSupabaseSession, isSupabaseConfigured } from './supabase';

export type DiagnosticState = 'ok' | 'warning' | 'error';
export type DiagnosticGroup = 'configuration' | 'services' | 'activity';

export interface DiagnosticCheck {
  id: string;
  label: string;
  state: DiagnosticState;
  detail: string;
  group: DiagnosticGroup;
  latencyMs?: number;
}

export interface DiagnosticReport {
  generatedAt: string;
  appVersion: string;
  buildVersion: string;
  platform: string;
  environment: string;
  commitSha?: string;
  releaseChannel?: string;
  checks: DiagnosticCheck[];
  recentEvents: RuntimeDiagnosticEvent[];
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
    return [{ id: 'edge', label: 'Rewrite endpoint', state: 'error', group: 'services', detail: 'Supabase URL is not configured.' }];
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
      promptVersion?: string;
      contractVersion?: string;
      model?: string;
      latencyMs?: number;
      code?: string;
      openai?: { state?: string; detail?: string };
      error?: string;
    };

    if (response.status === 403 && data.code === 'DIAGNOSTICS_ADMIN_REQUIRED') {
      return [{
        id: 'admin-access',
        label: 'Diagnostics access',
        state: 'error',
        group: 'services',
        detail: 'Sign in with the authorised Sentient administrator account to run production diagnostics.',
        latencyMs,
      }];
    }

    const edge: DiagnosticCheck = {
      id: 'edge',
      label: 'Rewrite endpoint',
      state: response.ok ? 'ok' : 'error',
      group: 'services',
      detail: response.ok ? `${data.version ?? 'unknown version'} · ${latencyMs} ms` : data.error ?? `HTTP ${response.status}`,
      latencyMs,
    };
    const openaiState = data.openai?.state;
    const openai: DiagnosticCheck = {
      id: 'openai',
      label: 'OpenAI connectivity',
      state: openaiState === 'ok' ? 'ok' : openaiState === 'rate_limited' ? 'warning' : 'error',
      group: 'services',
      detail: data.openai?.detail ?? (response.ok ? `Model ${data.model ?? 'unknown'}` : 'Unavailable'),
      latencyMs: data.latencyMs,
    };
    const versions: DiagnosticCheck = {
      id: 'versions',
      label: 'AI runtime versions',
      state: response.ok ? 'ok' : 'warning',
      group: 'configuration',
      detail: `Model ${data.model ?? 'unknown'} · Prompt ${data.promptVersion ?? 'unknown'} · Contract ${data.contractVersion ?? 'unknown'} · Backend ${data.version ?? 'unknown'}`,
    };
    return [edge, openai, versions];
  } catch (error) {
    return [{
      id: 'edge',
      label: 'Rewrite endpoint',
      state: 'error',
      group: 'services',
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
    group: 'configuration',
    detail: isSupabaseConfigured() ? 'Supabase URL and anonymous key are configured.' : 'Supabase configuration is missing.',
  });

  const session = await ensureSupabaseSession();
  checks.push({
    id: 'auth',
    label: 'Supabase session',
    state: session?.access_token ? 'ok' : 'error',
    group: 'services',
    detail: session?.user?.is_anonymous
      ? 'Healthy anonymous session. Admin diagnostics still require a named administrator sign-in.'
      : session?.user?.email
        ? `Healthy signed-in session for ${session.user.email}.`
        : 'No valid session.',
  });

  if (session?.access_token) {
    checks.push(...(await runEdgeDiagnostic(session.access_token)));
  }

  await refreshProStatus();
  checks.push({
    id: 'revenuecat',
    label: 'RevenueCat',
    state: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY ? 'ok' : 'warning',
    group: 'services',
    detail: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY ? (isPro() ? 'Configured · Pro entitlement active.' : 'Configured · Free entitlement.') : 'API key is not configured.',
  });

  const count = await getDailyRewriteCount();
  checks.push({
    id: 'quota',
    label: 'Local free usage',
    state: count >= FREE_DAILY_LIMIT ? 'warning' : 'ok',
    group: 'activity',
    detail: `${count} / ${FREE_DAILY_LIMIT} rewrites used today.`,
  });

  const recentEvents = await getRuntimeDiagnosticEvents();
  const lastRewrite = recentEvents[0];
  checks.push({
    id: 'last-rewrite',
    label: 'Last rewrite',
    state: !lastRewrite ? 'warning' : lastRewrite.status === 'success' ? 'ok' : 'error',
    group: 'activity',
    detail: !lastRewrite
      ? 'No rewrite has been recorded on this device yet.'
      : `${lastRewrite.status === 'success' ? 'Completed' : `Failed · ${lastRewrite.code ?? 'UNKNOWN'}`} · ${lastRewrite.latencyMs} ms · ${new Date(lastRewrite.at).toLocaleString()}`,
    latencyMs: lastRewrite?.latencyMs,
  });

  return {
    generatedAt: new Date().toISOString(),
    appVersion: Application.nativeApplicationVersion ?? Constants.expoConfig?.version ?? 'unknown',
    buildVersion: Application.nativeBuildVersion ?? 'development',
    platform: `${Platform.OS} ${Platform.Version}`,
    environment: __DEV__ ? 'Development' : 'Internal build',
    commitSha: process.env.EXPO_PUBLIC_GIT_SHA?.slice(0, 12),
    releaseChannel: process.env.EXPO_PUBLIC_RELEASE_CHANNEL,
    checks,
    recentEvents,
  };
}

export function formatDiagnosticReport(report: DiagnosticReport): string {
  const lines = [
    'Sentient diagnostics',
    `Generated: ${report.generatedAt}`,
    `Version: ${report.appVersion} (${report.buildVersion})`,
    `Platform: ${report.platform}`,
    `Environment: ${report.environment}`,
    report.releaseChannel ? `Release channel: ${report.releaseChannel}` : null,
    report.commitSha ? `Commit: ${report.commitSha}` : null,
    '',
    ...report.checks.map((check) => `${check.state.toUpperCase()} · ${check.label}: ${check.detail}`),
    '',
    'Recent rewrite events',
    ...(report.recentEvents.length
      ? report.recentEvents.map((event) => `${event.at} · ${event.status.toUpperCase()} · ${event.code ?? 'OK'} · ${event.latencyMs} ms`)
      : ['None recorded']),
  ].filter((line): line is string => line !== null);
  return lines.join('\n');
}