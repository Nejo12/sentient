import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { ArrowLeft, CheckCircle2, CircleAlert, CircleX, Copy, RefreshCw } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../src/components/Button';
import { Card } from '../src/components/Card';
import {
  formatDiagnosticReport,
  runDiagnostics,
  type DiagnosticCheck,
  type DiagnosticGroup,
  type DiagnosticReport,
} from '../src/services/diagnostics';
import { colors, radii, spacing } from '../src/theme/tokens';
import { fonts } from '../src/theme/typography';

const GROUPS: { key: DiagnosticGroup; label: string }[] = [
  { key: 'configuration', label: 'Configuration' },
  { key: 'services', label: 'Live services' },
  { key: 'activity', label: 'Activity' },
];

function StatusIcon({ check }: { check: DiagnosticCheck }) {
  if (check.state === 'ok') return <CheckCircle2 color={colors.olive} size={18} />;
  if (check.state === 'warning') return <CircleAlert color={colors.clay} size={18} />;
  return <CircleX color={colors.destructive} size={18} />;
}

function stateLabel(check: DiagnosticCheck): string {
  if (check.state === 'ok') return 'Healthy';
  if (check.state === 'warning') return 'Warning';
  return 'Error';
}

export default function DiagnosticsScreen() {
  const [report, setReport] = useState<DiagnosticReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const groupedChecks = useMemo(() => {
    if (!report) return new Map<DiagnosticGroup, DiagnosticCheck[]>();
    return GROUPS.reduce((map, group) => {
      map.set(group.key, report.checks.filter((check) => check.group === group.key));
      return map;
    }, new Map<DiagnosticGroup, DiagnosticCheck[]>());
  }, [report]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setCopied(false);
    setReport(await runDiagnostics());
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;

    void runDiagnostics()
      .then((nextReport) => {
        if (!cancelled) setReport(nextReport);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const copyReport = useCallback(async () => {
    if (!report) return;
    await Clipboard.setStringAsync(formatDiagnosticReport(report));
    setCopied(true);
  }, [report]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable accessibilityLabel="Go back" accessibilityRole="button" onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft color={colors.ink55} size={18} />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>Developer diagnostics</Text>
            <Text style={styles.subtitle}>Live internal health checks. No secret values are displayed.</Text>
          </View>
        </View>

        {report ? (
          <Card style={styles.summaryCard} variant="panel">
            <Text style={styles.summaryTitle}>Sentient {report.appVersion}</Text>
            <Text style={styles.summaryText}>{report.platform} · build {report.buildVersion}</Text>
            <Text style={styles.summaryText}>{report.environment} · {new Date(report.generatedAt).toLocaleString()}</Text>
            {report.releaseChannel ? <Text style={styles.summaryText}>Channel {report.releaseChannel}</Text> : null}
            {report.commitSha ? <Text style={styles.summaryText}>Commit {report.commitSha}</Text> : null}
          </Card>
        ) : null}

        <View style={styles.actions}>
          <Button
            icon={loading ? <ActivityIndicator color={colors.oxbloodFg} size="small" /> : <RefreshCw color={colors.oxbloodFg} size={15} />}
            onPress={() => void refresh()}
            style={styles.action}
            variant="primary"
          >
            {loading ? 'Running checks…' : 'Run diagnostics'}
          </Button>
          <Button
            disabled={!report}
            icon={<Copy color={colors.ink72} size={15} />}
            onPress={() => void copyReport()}
            style={styles.action}
            variant="secondary"
          >
            {copied ? 'Report copied' : 'Copy report'}
          </Button>
        </View>

        {GROUPS.map((group) => {
          const checks = groupedChecks.get(group.key) ?? [];
          if (!checks.length) return null;
          return (
            <View key={group.key} style={styles.section}>
              <Text style={styles.sectionTitle}>{group.label}</Text>
              <View style={styles.stack}>
                {checks.map((check) => (
                  <Card key={check.id} style={styles.checkCard} variant="panel">
                    <View style={styles.checkHeader}>
                      <StatusIcon check={check} />
                      <Text style={styles.checkLabel}>{check.label}</Text>
                      <Text
                        style={[
                          styles.state,
                          check.state === 'warning' && styles.stateWarning,
                          check.state === 'error' && styles.stateError,
                        ]}
                      >
                        {stateLabel(check)}
                      </Text>
                    </View>
                    <Text style={styles.detail}>{check.detail}</Text>
                  </Card>
                ))}
              </View>
            </View>
          );
        })}

        {report?.recentEvents.length ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent rewrite events</Text>
            <Card style={styles.eventsCard} variant="panel">
              {report.recentEvents.map((event, index) => (
                <View key={`${event.at}-${index}`} style={[styles.eventRow, index > 0 && styles.eventDivider]}>
                  <View style={styles.eventCopy}>
                    <Text style={styles.eventTitle}>{event.status === 'success' ? 'Rewrite completed' : event.code ?? 'Rewrite failed'}</Text>
                    <Text style={styles.eventMeta}>{new Date(event.at).toLocaleString()} · {event.latencyMs} ms</Text>
                  </View>
                  <Text style={[styles.eventState, event.status === 'error' && styles.stateError]}>
                    {event.status === 'success' ? 'OK' : 'ERROR'}
                  </Text>
                </View>
              ))}
            </Card>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.paper },
  content: { padding: 18, paddingBottom: spacing[8], gap: spacing[4] },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing[3] },
  backButton: { width: 34, height: 34, borderRadius: radii.pill, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  headerCopy: { flex: 1, gap: spacing[1] },
  title: { color: colors.ink, fontFamily: fonts.serif, fontSize: 30, lineHeight: 36 },
  subtitle: { color: colors.ink55, fontFamily: fonts.sans, fontSize: 13, lineHeight: 19 },
  summaryCard: { padding: spacing[4], gap: spacing[1] },
  summaryTitle: { color: colors.ink, fontFamily: fonts.sansSemiBold, fontSize: 15 },
  summaryText: { color: colors.ink55, fontFamily: fonts.sans, fontSize: 12, lineHeight: 17 },
  actions: { flexDirection: 'row', gap: spacing[2] },
  action: { flex: 1 },
  section: { gap: spacing[2] },
  sectionTitle: { color: colors.ink55, fontFamily: fonts.sansSemiBold, fontSize: 12, letterSpacing: 0.8, textTransform: 'uppercase' },
  stack: { gap: spacing[3] },
  checkCard: { padding: spacing[4], gap: spacing[2] },
  checkHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  checkLabel: { flex: 1, color: colors.ink, fontFamily: fonts.sansSemiBold, fontSize: 14 },
  state: { color: colors.olive, fontFamily: fonts.sansMedium, fontSize: 11, textTransform: 'uppercase' },
  stateWarning: { color: colors.clay },
  stateError: { color: colors.destructive },
  detail: { color: colors.ink72, fontFamily: fonts.sans, fontSize: 13, lineHeight: 19 },
  eventsCard: { paddingHorizontal: spacing[4], paddingVertical: spacing[2] },
  eventRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing[3], gap: spacing[3] },
  eventDivider: { borderTopWidth: 1, borderTopColor: colors.border },
  eventCopy: { flex: 1, gap: spacing[1] },
  eventTitle: { color: colors.ink, fontFamily: fonts.sansSemiBold, fontSize: 13 },
  eventMeta: { color: colors.ink55, fontFamily: fonts.sans, fontSize: 11 },
  eventState: { color: colors.olive, fontFamily: fonts.sansMedium, fontSize: 10 },
});
