import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { ArrowLeft, CheckCircle2, CircleAlert, CircleX, Copy, RefreshCw } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../src/components/Button';
import { Card } from '../src/components/Card';
import { formatDiagnosticReport, runDiagnostics, type DiagnosticCheck, type DiagnosticReport } from '../src/services/diagnostics';
import { colors, radii, spacing } from '../src/theme/tokens';
import { fonts } from '../src/theme/typography';

function StatusIcon({ check }: { check: DiagnosticCheck }) {
  if (check.state === 'ok') return <CheckCircle2 color={colors.olive} size={18} />;
  if (check.state === 'warning') return <CircleAlert color={colors.clay} size={18} />;
  return <CircleX color={colors.destructive} size={18} />;
}

export default function DiagnosticsScreen() {
  const [report, setReport] = useState<DiagnosticReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setCopied(false);
    setReport(await runDiagnostics());
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

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
            <Text style={styles.subtitle}>Internal health checks. No secret values are displayed.</Text>
          </View>
        </View>

        {report ? (
          <Card style={styles.summaryCard} variant="panel">
            <Text style={styles.summaryTitle}>Sentient {report.appVersion}</Text>
            <Text style={styles.summaryText}>{report.platform} · build {report.buildVersion}</Text>
            <Text style={styles.summaryText}>{report.environment} · {new Date(report.generatedAt).toLocaleString()}</Text>
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

        <View style={styles.stack}>
          {report?.checks.map((check) => (
            <Card key={check.id} style={styles.checkCard} variant="panel">
              <View style={styles.checkHeader}>
                <StatusIcon check={check} />
                <Text style={styles.checkLabel}>{check.label}</Text>
                <Text style={[styles.state, check.state === 'error' && styles.stateError]}>{check.state}</Text>
              </View>
              <Text style={styles.detail}>{check.detail}</Text>
            </Card>
          ))}
        </View>
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
  stack: { gap: spacing[3] },
  checkCard: { padding: spacing[4], gap: spacing[2] },
  checkHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  checkLabel: { flex: 1, color: colors.ink, fontFamily: fonts.sansSemiBold, fontSize: 14 },
  state: { color: colors.ink55, fontFamily: fonts.sansMedium, fontSize: 11, textTransform: 'uppercase' },
  stateError: { color: colors.destructive },
  detail: { color: colors.ink72, fontFamily: fonts.sans, fontSize: 13, lineHeight: 19 },
});
