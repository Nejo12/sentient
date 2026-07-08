import * as Clipboard from 'expo-clipboard';
import { useShareIntentContext } from 'expo-share-intent';
import * as Linking from 'expo-linking';
import { useLinkingURL } from 'expo-linking';
import { router, useLocalSearchParams } from 'expo-router';
import { Sparkles, X } from 'lucide-react-native';
import { useEffect, useMemo, useRef } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandMark } from '../../src/components/BrandMark';
import { Input } from '../../src/components/Input';
import { IntentCard } from '../../src/components/IntentCard';
import { UnderstandingChip } from '../../src/components/UnderstandingChip';
import { strings } from '../../src/constants/strings';
import { UNDERSTANDING_OPTIONS } from '../../src/constants/understanding';
import {
  canRewrite,
  incrementRewriteCount,
} from '../../src/services/entitlements';
import { fetchRewrites } from '../../src/services/rewriteApi';
import {
  isShareExtensionUrl,
  parseNativeShareIntent,
  parseShareIntent,
} from '../../src/services/shareIntent';
import { useSessionStore } from '../../src/store/sessionStore';
import { colors, radii, spacing } from '../../src/theme/tokens';
import { fonts } from '../../src/theme/typography';
import type { Intent, Understanding } from '../../src/types/rewrite';

const FALLBACK_NAME = 'them';
const FALLBACK_SOURCE_APP = 'your chat app';

function getSingleParam(param: string | string[] | undefined): string | undefined {
  if (Array.isArray(param)) {
    return param[0];
  }
  return param;
}

export default function ChooseScreen() {
  const { message, text, name, app, sourceApp } = useLocalSearchParams<{
    message?: string | string[];
    text?: string | string[];
    name?: string | string[];
    app?: string | string[];
    sourceApp?: string | string[];
  }>();

  const url = useLinkingURL();
  const { hasShareIntent, shareIntent, resetShareIntent, isReady } = useShareIntentContext();
  const fallbackName = getSingleParam(name) ?? FALLBACK_NAME;
  const fallbackSourceApp =
    getSingleParam(sourceApp) ?? getSingleParam(app) ?? FALLBACK_SOURCE_APP;

  const nativeContext = useMemo(
    () => parseNativeShareIntent(shareIntent),
    [shareIntent],
  );

  const routeContext = useMemo(() => {
    return parseShareIntent({
      params: {
        message: getSingleParam(message),
        text: getSingleParam(text),
        sourceApp: getSingleParam(sourceApp),
        app: getSingleParam(app),
      },
    });
  }, [app, message, sourceApp, text]);

  const resolvedContext = nativeContext ?? routeContext;
  const isAndroidBubbleLaunch =
    getSingleParam(sourceApp) === 'Android' && !getSingleParam(message);
  const isShareOpen = hasShareIntent || isShareExtensionUrl(url) || isAndroidBubbleLaunch;

  const {
    capturedMessage,
    contactName,
    roughDraft,
    intent,
    understanding,
    showUnderstandingGrid,
    loading,
    error,
    setCapturedContext,
    setRoughDraft,
    setIntent,
    setUnderstanding,
    setResults,
    setLoading,
    setError,
  } = useSessionStore();

  // Once a message has been captured, keep showing it even after
  // resetShareIntent() clears the live native context back to empty.
  const isLoadingSharedMessage = isShareOpen && !capturedMessage && (!isReady || !resolvedContext);

  // expo-share-intent hands back a new resetShareIntent function identity on
  // every render (it isn't memoized upstream). Keeping it out of the effect's
  // dependency array via a ref avoids re-running the capture effect on every
  // unrelated re-render, which would otherwise re-fire setCapturedContext in
  // a loop.
  const resetShareIntentRef = useRef(resetShareIntent);
  useEffect(() => {
    resetShareIntentRef.current = resetShareIntent;
  });

  useEffect(() => {
    if (!resolvedContext) {
      return;
    }

    setCapturedContext(
      resolvedContext.message,
      fallbackName,
      resolvedContext.sourceApp || fallbackSourceApp,
    );

    if (hasShareIntent) {
      resetShareIntentRef.current();
    }
  }, [
    fallbackName,
    fallbackSourceApp,
    hasShareIntent,
    resolvedContext,
    setCapturedContext,
  ]);

  useEffect(() => {
    const applyParsedIntent = (parsedIntent: ReturnType<typeof parseShareIntent>) => {
      if (!parsedIntent) {
        return;
      }

      setCapturedContext(
        parsedIntent.message,
        fallbackName,
        parsedIntent.sourceApp || fallbackSourceApp,
      );
    };

    void Linking.getInitialURL().then((initialUrl) => {
      applyParsedIntent(parseShareIntent({ url: initialUrl }));
    });

    const subscription = Linking.addEventListener('url', (event) => {
      applyParsedIntent(parseShareIntent({ url: event.url }));
    });

    return () => {
      subscription.remove();
    };
  }, [fallbackName, fallbackSourceApp, setCapturedContext]);

  // The Android floating bubble launches this screen via a deep link
  // (sentient://choose?sourceApp=Android) with no message param, because the
  // overlay service is never focused and Android 10+ denies clipboard reads
  // to unfocused apps. Once this screen is on screen, Sentient's activity has
  // real focus, so the clipboard read here succeeds for real cross-app copies.
  useEffect(() => {
    if (getSingleParam(sourceApp) !== 'Android' || getSingleParam(message)) {
      return;
    }

    void Clipboard.getStringAsync().then((clipText) => {
      const trimmed = clipText?.trim();
      if (trimmed) {
        setCapturedContext(trimmed, fallbackName, 'Android');
      }
    });
  }, [fallbackName, message, setCapturedContext, sourceApp]);

  const submit = async (nextIntent: Intent, nextUnderstanding?: Understanding) => {
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
      intent: nextIntent,
      understanding: nextUnderstanding,
      contactName,
    });

    if (!response.success) {
      setError(response.message || strings.errors.network);
      setLoading(false);
      return;
    }

    await incrementRewriteCount();
    setResults(response.options, response.perspective ?? null);
    setLoading(false);
    router.push('/(flow)/compare');
  };

  const onSelectMissing = () => {
    setIntent('missing');
    void submit('missing');
  };

  const onSelectDo = () => {
    setIntent('do');
  };

  const onSelectUnderstanding = (nextUnderstanding: Understanding) => {
    setUnderstanding(nextUnderstanding);
    void submit('do', nextUnderstanding);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.brandWrap}>
            <BrandMark />
            <Text style={styles.wordmark}>{strings.brand.name}</Text>
          </View>
          <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.closeButton}>
            <X color={colors.ink55} size={16} strokeWidth={2} />
          </Pressable>
        </View>

        <View style={styles.block}>
          <Text style={styles.replyingTo}>{strings.choose.replyingTo(contactName || fallbackName)}</Text>
          <View style={styles.quoteCard}>
            {isLoadingSharedMessage ? (
              <ActivityIndicator color={colors.clay} />
            ) : (
              <Text style={styles.quote}>{capturedMessage}</Text>
            )}
          </View>
        </View>

        <View style={styles.block}>
          <Text style={styles.eyebrow}>{strings.choose.roughDraftLabel}</Text>
          <Input
            editable={!loading}
            multiline
            onChangeText={setRoughDraft}
            placeholder="Write your draft here"
            style={styles.roughDraftInput}
            value={roughDraft}
          />
        </View>

        <View style={styles.block}>
          <Text style={styles.eyebrow}>{strings.choose.whatDoYouNeed}</Text>
          <View style={styles.intentRow}>
            <IntentCard
              disabled={loading}
              onPress={onSelectDo}
              selected={intent === 'do'}
              subtitle={strings.choose.intentDoSubtitle}
              title={strings.choose.intentDoTitle}
            />
            <IntentCard
              disabled={loading}
              onPress={onSelectMissing}
              selected={intent === 'missing'}
              subtitle={strings.choose.intentMissingSubtitle}
              title={strings.choose.intentMissingTitle}
            />
          </View>
        </View>

        {showUnderstandingGrid ? (
          <View style={styles.block}>
            <Text style={styles.eyebrow}>{strings.choose.understandingEyebrow}</Text>
            <View style={styles.grid}>
              {UNDERSTANDING_OPTIONS.map((option) => (
                <View key={option.key} style={styles.gridItem}>
                  <UnderstandingChip
                    disabled={loading}
                    label={option.label}
                    onPress={() => onSelectUnderstanding(option.key)}
                    selected={understanding === option.key}
                  />
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {loading ? (
          <View style={styles.loadingRow}>
            <Sparkles color={colors.clay} size={14} strokeWidth={1.9} />
            <Text style={styles.loadingText}>Finding options for you...</Text>
          </View>
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  wordmark: {
    color: colors.ink,
    fontFamily: fonts.serif,
    fontSize: 24,
    lineHeight: 28,
    letterSpacing: -0.3,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  block: {
    gap: spacing[2],
  },
  replyingTo: {
    color: colors.ink55,
    fontFamily: fonts.sansMedium,
    fontWeight: '500',
    fontSize: 12,
    lineHeight: 16,
  },
  quoteCard: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.paperStrong,
    padding: spacing[3],
  },
  quote: {
    color: colors.ink72,
    fontFamily: fonts.sans,
    fontWeight: '400',
    fontSize: 13,
    lineHeight: 20,
  },
  eyebrow: {
    color: colors.clay,
    fontFamily: fonts.sansSemiBold,
    fontWeight: '600',
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.35,
  },
  roughDraftInput: {
    minHeight: 84,
  },
  intentRow: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
    rowGap: spacing[2],
  },
  gridItem: {
    width: '50%',
    paddingHorizontal: 4,
  },
  loadingRow: {
    marginTop: spacing[1],
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  loadingText: {
    color: colors.ink55,
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
});
