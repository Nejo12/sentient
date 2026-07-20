import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CommunicationAnalysisPanel } from '../../src/components/CommunicationAnalysisPanel';
import { PerspectiveCard } from '../../src/components/PerspectiveCard';
import { Pill } from '../../src/components/Pill';
import { QuickReplyCard } from '../../src/components/QuickReplyCard';
import { ResultCard } from '../../src/components/ResultCard';
import { strings } from '../../src/constants/strings';
import { UNDERSTANDING_OPTIONS } from '../../src/constants/understanding';
import { canRewrite, incrementRewriteCount } from '../../src/services/entitlements';
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
    analysis,
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
  const [understandingOpen, setUnderstandingOpen] = useState(false);
  const [alternativesOpen, setAlternativesOpen] = useState(false);
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

  const recommendedOption = useMemo(
    () => results.find((option) => option.recommended) ?? results[0] ?? null,
    [results],
  );

  const alternativeOptions = useMemo(
    () => results.filter((option) => option !== recommendedOption),
    [recommendedOption, results],
  );

  const caution = useMemo(() => {
    if (!analysis) {
      return null;
    }
    if (analysis.watchOutFor.length) {
      return analysis.watchOutFor[0];
    }
    if (analysis.possibleMeanings.length > 1) {
      return 'Several reasonable interpretations remain possible. A clarifying reply may be safer than assuming tone.';
    }
    return null;
  }, [analysis]);

  const regenerateLabel =
    intent === 'missing' ? strings.compare.regenerateMissing : strings.compare.regenerateDo;

  const onRegenerate = async () => {
    if (!intent) {
      return;
    }

    setError(null);
    setLoading(true);
    setUnderstandingOpen(false);
    setAlternativesOpen(false);

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
    setResults(response.options, response.analysis);
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
          <Pill variant="neutral">Adaptive</Pill>
        </View>

        {copyFeedback ? <Text style={styles.copyFeedback}>{copyFeedback}</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {loading ? (
          <View style={styles.loadingBlock}>
            <Text style={styles.loadingTitle}>Understanding the message…</Text>
            <Text style={styles.loadingBody}>Considering context, ambiguity, and the clearest safe reply.</Text>
            <View style={styles.skeletonCard} testID="compare-skeleton-card">
              <View style={[styles.skeletonLine, styles.skeletonTitle]} />
              <View style={[styles.skeletonLine, styles.skeletonBody]} />
              <View style={[styles.skeletonLine, styles.skeletonBodyShort]} />
            </View>
          </View>
        ) : (
          <View style={styles.stack}>
            {recommendedOption ? (
              <QuickReplyCard
                caution={caution}
                onCopy={() => {
                  void onCopy(recommendedOption.text);
                }}
                onSendBack={() => onSendBack(recommendedOption.text)}
                option={recommendedOption}
              />
            ) : null}

            {analysis ? (
              <>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ expanded: understandingOpen }}
                  onPress={() => setUnderstandingOpen((current) => !current)}
                  style={({ pressed }) => [styles.disclosureButton, pressed && styles.pressed]}
                >
                  <Text style={styles.disclosureText}>
                    {understandingOpen ? 'Hide understanding' : 'Understand more'}
                  </Text>
                  {understandingOpen ? (
                    <ChevronUp color={colors.oxblood} size={18} strokeWidth={2} />
                  ) : (
                    <ChevronDown color={colors.oxblood} size={18} strokeWidth={2} />
                  )}
                </Pressable>
                {understandingOpen ? <CommunicationAnalysisPanel analysis={analysis} /> : null}
              </>
            ) : null}

            {!analysis && intent === 'missing' && perspective ? (
              <PerspectiveCard text={perspective} />
            ) : null}

            {alternativeOptions.length ? (
              <>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ expanded: alternativesOpen }}
                  onPress={() => setAlternativesOpen((current) => !current)}
                  style={({ pressed }) => [styles.disclosureButton, pressed && styles.pressed]}
                >
                  <Text style={styles.disclosureText}>
                    {alternativesOpen ? 'Hide alternatives' : `See ${alternativeOptions.length} other replies`}
                  </Text>
                  {alternativesOpen ? (
                    <ChevronUp color={colors.oxblood} size={18} strokeWidth={2} />
                  ) : (
                    <ChevronDown color={colors.oxblood} size={18} strokeWidth={2} />
                  )}
                </Pressable>

                {alternativesOpen ? (
                  <View style={styles.alternativesStack}>
                    <Text style={styles.responsesHeading}>{strings.analysis.repliesTitle}</Text>
                    {alternativeOptions.map((option) => (
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
                ) : null}
              </>
            ) : null}
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
  alternativesStack: {
    gap: spacing[3],
  },
  responsesHeading: {
    marginTop: spacing[2],
    color: colors.ink,
    fontFamily: fonts.serif,
    fontSize: 23,
    lineHeight: 29,
  },
  disclosureButton: {
    minHeight: 46,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.paperSoft,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[1],
    paddingHorizontal: spacing[3],
  },
  disclosureText: {
    color: colors.oxblood,
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
    lineHeight: 18,
  },
  pressed: {
    opacity: 0.72,
  },
  loadingBlock: {
    gap: spacing[3],
    paddingVertical: spacing[5],
  },
  loadingTitle: {
    color: colors.ink,
    fontFamily: fonts.serif,
    fontSize: 24,
    lineHeight: 30,
  },
  loadingBody: {
    color: colors.ink55,
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 19,
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
