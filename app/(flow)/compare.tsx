import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PerspectiveCard } from '../../src/components/PerspectiveCard';
import { Pill } from '../../src/components/Pill';
import { ResultCard } from '../../src/components/ResultCard';
import { strings } from '../../src/constants/strings';
import { UNDERSTANDING_OPTIONS } from '../../src/constants/understanding';
import {
  canRewrite,
  incrementRewriteCount,
} from '../../src/services/entitlements';
import { saveRewrite } from '../../src/services/historyService';
import { fetchRewrites } from '../../src/services/rewriteApi';
import { useSessionStore } from '../../src/store/sessionStore';
import { useSettingsStore } from '../../src/store/settingsStore';
import { colors, radii, spacing } from '../../src/theme/tokens';
import { fonts } from '../../src/theme/typography';
import { goBackOrHome } from '../../src/utils/navigation';

const COPY_FEEDBACK_MS = 1200;

export default function CompareScreen() {
  const {
    capturedMessage,
    contactName,
    sourceApp,
    roughDraft,
    intent,
    understanding,
    perspective,
    results,
    loading,
    error,
    setResults,
    setLoading,
    setError,
    setChosenReply,
  } = useSessionStore();
  const saveHistory = useSettingsStore((state) => state.saveHistory);

  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const copyFeedbackTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (copyFeedbackTimeout.current) {
        clearTimeout(copyFeedbackTimeout.current);
      }
    },
    [],
  );

  const headerTitle = useMemo(() => {
    if (intent === 'missing') {
      return strings.compare.missingHeader;
    }

    const understandingLabel = UNDERSTANDING_OPTIONS.find(
      (option) => option.key === understanding,
    )?.label;
    return strings.compare.doHeader(understandingLabel ?? 'Your');
  }, [intent, understanding]);

  const regenerateLabel =
    intent === 'missing'
      ? strings.compare.regenerateMissing
      : strings.compare.regenerateDo;

  const onRegenerate = async () => {
    if (!intent) {
      return;
    }

    setError(null);
    setLoading(true);

    if (!(await canRewrite())) {
      setError(`${strings.pro.limitReached} ${strings.pro.nudge}`);
      setLoading(false);
      return;
    }

    const response = await fetchRewrites({
      capturedMessage,
      roughDraft: roughDraft.trim() ? roughDraft : null,
      intent,
      understanding,
      contactName,
    });

    if (!response.success) {
      setError(response.message || strings.errors.network);
      setLoading(false);
      return;
    }

    await incrementRewriteCount();
    setResults(response.options, response.perspective ?? undefined);
    setLoading(false);
  };

  const onCopy = async (text: string) => {
    await Clipboard.setStringAsync(text);
    setCopyFeedback(strings.sendBack.copiedToast);

    if (copyFeedbackTimeout.current) {
      clearTimeout(copyFeedbackTimeout.current);
    }

    copyFeedbackTimeout.current = setTimeout(() => {
      setCopyFeedback(null);
    }, COPY_FEEDBACK_MS);

    // Copying here is the same "I used this reply" signal as copying from
    // the Send Back screen — it must save to history too, not just that
    // second screen's copy button.
    if (saveHistory && intent) {
      await saveRewrite({
        contactName,
        sourceApp,
        intent,
        understanding,
        fullText: text,
      });
    }
  };

  const onSendBack = (text: string) => {
    setChosenReply(text);
    router.push('/(flow)/send-back');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Pressable accessibilityRole="button" onPress={goBackOrHome} style={styles.backButton}>
            <ArrowLeft color={colors.ink55} size={16} strokeWidth={2} />
          </Pressable>
          <Text style={styles.headerTitle}>{headerTitle}</Text>
          <Pill variant="neutral">{strings.compare.optionsPill}</Pill>
        </View>

        {copyFeedback ? <Text style={styles.copyFeedback}>{copyFeedback}</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {loading ? (
          <View style={styles.stack}>
            {Array.from({ length: 3 }).map((_, index) => (
              <View key={`skeleton-${index}`} style={styles.skeletonCard} testID="compare-skeleton-card">
                <View style={[styles.skeletonLine, styles.skeletonTitle]} />
                <View style={[styles.skeletonLine, styles.skeletonMeta]} />
                <View style={[styles.skeletonLine, styles.skeletonBody]} />
                <View style={[styles.skeletonLine, styles.skeletonBodyShort]} />
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.stack}>
            {intent === 'missing' && perspective ? <PerspectiveCard text={perspective} /> : null}

            {results.map((option) => (
              <ResultCard
                key={`${option.label}-${option.tag}-${option.text.slice(0, 16)}`}
                onCopy={() => {
                  void onCopy(option.text);
                }}
                onSendBack={() => onSendBack(option.text)}
                option={option}
              />
            ))}
          </View>
        )}

        <Pressable accessibilityRole="button" onPress={() => void onRegenerate()} style={styles.footerAction}>
          <Text style={styles.footerActionText}>{regenerateLabel}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: spacing[4],
    paddingBottom: spacing[6],
    gap: spacing[4],
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[2],
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  headerTitle: {
    flex: 1,
    color: colors.ink,
    fontFamily: fonts.serif,
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.4,
  },
  copyFeedback: {
    color: colors.olive,
    fontFamily: fonts.sansMedium,
    fontWeight: '500',
    fontSize: 12,
    lineHeight: 16,
  },
  error: {
    color: colors.destructive,
    fontFamily: fonts.sansMedium,
    fontWeight: '500',
    fontSize: 12,
    lineHeight: 16,
  },
  stack: {
    gap: spacing[3],
  },
  skeletonCard: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.paperStrong,
    padding: spacing[4],
    gap: spacing[2],
  },
  skeletonLine: {
    borderRadius: radii.sm,
    backgroundColor: '#E5DDD2',
    height: 12,
  },
  skeletonTitle: {
    width: '44%',
    height: 14,
  },
  skeletonMeta: {
    width: '32%',
  },
  skeletonBody: {
    width: '100%',
  },
  skeletonBodyShort: {
    width: '84%',
  },
  footerAction: {
    alignSelf: 'center',
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[2],
  },
  footerActionText: {
    color: colors.oxblood,
    fontFamily: fonts.sansSemiBold,
    fontWeight: '600',
    fontSize: 13,
    lineHeight: 18,
    textDecorationLine: 'underline',
    textDecorationColor: colors.oxblood,
  },
});
