import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { ArrowLeft, RefreshCw } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CommunicationAnalysisPanel } from '../../src/components/CommunicationAnalysisPanel';
import { PerspectiveCard } from '../../src/components/PerspectiveCard';
import { Pill } from '../../src/components/Pill';
import { QuickReplyCard } from '../../src/components/QuickReplyCard';
import { ResultCard } from '../../src/components/ResultCard';
import { DisclosureSection } from '../../src/components/adaptive/DisclosureSection';
import { ProgressLoader } from '../../src/components/adaptive/ProgressLoader';
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
  const requestSequence = useRef(0);
  const copyFeedbackTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      requestSequence.current += 1;
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
    if (!intent || loading) {
      return;
    }

    const requestId = requestSequence.current + 1;
    requestSequence.current = requestId;

    setUnderstandingOpen(false);
    setAlternativesOpen(false);
    setError(null);
    setLoading(true);

    if (!(await canRewrite())) {
      if (requestId !== requestSequence.current) {
        return;
      }
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

    if (requestId !== requestSequence.current) {
      return;
    }

    if (!response.success) {
      setError(response.message || strings.errors.network);
      setLoading(false);
      return;
    }

    await incrementRewriteCount();
    if (requestId !== requestSequence.current) {
      return;
    }
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
          <Pressable
            accessibilityLabel="Go back"
            accessibilityRole="button"
            hitSlop={8}
            onPress={goBackOrHome}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
          >
            <ArrowLeft color={colors.ink55} size={16} strokeWidth={2} />
          </Pressable>
          <Text style={styles.headerTitle}>{headerTitle}</Text>
          <Pill variant="neutral">Adaptive</Pill>
        </View>

        {copyFeedback ? (
          <Text accessibilityLiveRegion="polite" style={styles.copyFeedback}>
            {copyFeedback}
          </Text>
        ) : null}

        {error && !loading ? (
          <View accessibilityLiveRegion="assertive" style={styles.errorCard}>
            <Text style={styles.errorTitle}>We couldn&apos;t finish analyzing this message.</Text>
            <Text style={styles.errorBody}>{error}</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => void onRegenerate()}
              style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}
            >
              <RefreshCw color={colors.oxblood} size={15} strokeWidth={2} />
              <Text style={styles.retryText}>Try again</Text>
            </Pressable>
          </View>
        ) : null}

        {loading ? (
          <ProgressLoader />
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
              <DisclosureSection
                closedLabel="Understand more"
                expanded={understandingOpen}
                onToggle={() => setUnderstandingOpen((current) => !current)}
                openLabel="Hide understanding"
                testID="understanding-disclosure"
              >
                <CommunicationAnalysisPanel analysis={analysis} />
              </DisclosureSection>
            ) : null}

            {!analysis && intent === 'missing' && perspective ? (
              <PerspectiveCard text={perspective} />
            ) : null}

            {alternativeOptions.length ? (
              <DisclosureSection
                closedLabel={`See ${alternativeOptions.length} other replies`}
                expanded={alternativesOpen}
                onToggle={() => setAlternativesOpen((current) => !current)}
                openLabel="Hide alternatives"
                testID="alternatives-disclosure"
              >
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
              </DisclosureSection>
            ) : null}
          </View>
        )}

        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: loading }}
          disabled={loading}
          onPress={() => void onRegenerate()}
          style={({ pressed }) => [
            styles.footerAction,
            loading && styles.disabled,
            pressed && styles.pressed,
          ]}
        >
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
    width: 44,
    height: 44,
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
  errorCard: {
    gap: spacing[2],
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(145, 53, 45, 0.22)',
    backgroundColor: 'rgba(145, 53, 45, 0.035)',
    padding: spacing[4],
  },
  errorTitle: {
    color: colors.ink,
    fontFamily: fonts.sansSemiBold,
    fontWeight: '600',
    fontSize: 14,
    lineHeight: 20,
  },
  errorBody: {
    color: colors.ink55,
    fontFamily: fonts.sans,
    fontSize: 12,
    lineHeight: 18,
  },
  retryButton: {
    alignSelf: 'flex-start',
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[2],
  },
  retryText: {
    color: colors.oxblood,
    fontFamily: fonts.sansSemiBold,
    fontWeight: '600',
    fontSize: 13,
    lineHeight: 18,
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
  pressed: {
    opacity: 0.76,
    transform: [{ scale: 0.99 }],
  },
  disabled: {
    opacity: 0.45,
  },
  footerAction: {
    minHeight: 44,
    alignSelf: 'center',
    justifyContent: 'center',
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