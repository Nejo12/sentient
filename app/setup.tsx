import { router } from 'expo-router';
import { Check, Layers, Lock, Share } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import {
  AppState,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandMark } from '../src/components/BrandMark';
import { Button } from '../src/components/Button';
import { Card } from '../src/components/Card';
import { strings } from '../src/constants/strings';
import { startBubble, stopBubble } from '../src/services/bubbleService';
import {
  isOverlayPermissionGranted,
  requestOverlayPermission,
} from '../src/services/overlayPermission';
import {
  isOverlaySetupDone,
  isShareSetupDone,
  setOverlaySetupDone,
  setSetupComplete,
  setShareSetupDone,
} from '../src/services/setupStorage';
import { colors, radii, shadows, spacing } from '../src/theme/tokens';
import { fonts } from '../src/theme/typography';

const DEV_CHOOSE_PARAMS = {
  pathname: '/(flow)/choose' as const,
  params: {
    message: "So you're just cancelling again? Cool. Guess I'll figure it out myself.",
    name: 'Sam',
    app: 'WhatsApp',
  },
};

async function loadOverlayDoneState(): Promise<{ done: boolean; granted: boolean }> {
  const [storedDone, granted] = await Promise.all([
    isOverlaySetupDone(),
    isOverlayPermissionGranted(),
  ]);
  const done = storedDone || granted;
  if (done && !storedDone) {
    await setOverlaySetupDone();
  }
  return { done, granted };
}

export default function SetupScreen() {
  const [shareDone, setShareDone] = useState(false);
  const [overlayDone, setOverlayDone] = useState(false);

  const refreshOverlayDone = useCallback(async () => {
    const { done } = await loadOverlayDoneState();
    setOverlayDone(done);
  }, []);

  useEffect(() => {
    void isShareSetupDone().then(setShareDone);
    if (Platform.OS === 'android') {
      void loadOverlayDoneState().then(({ done, granted }) => {
        setOverlayDone(done);
        if (granted) {
          void startBubble();
        }
      });
    }
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        void refreshOverlayDone();
        void isOverlayPermissionGranted().then((granted) => {
          if (!granted) {
            void stopBubble();
          }
        });
      }
    });

    return () => subscription.remove();
  }, [refreshOverlayDone]);

  const handleShareRowPress = useCallback(async () => {
    await Linking.openSettings();
    await setShareSetupDone();
    setShareDone(true);
  }, []);

  const handleOverlayRowPress = useCallback(async () => {
    await requestOverlayPermission();
    const { done, granted } = await loadOverlayDoneState();
    setOverlayDone(done);
    if (granted) {
      await startBubble();
    }
  }, []);

  const handleContinue = useCallback(async () => {
    await setSetupComplete();
    if (__DEV__) {
      router.replace(DEV_CHOOSE_PARAMS);
      return;
    }
    router.replace('/(tabs)');
  }, []);

  const handleSignIn = useCallback(() => {
    router.push('/auth/sign-in');
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.brandBlock}>
          <BrandMark size={66} style={styles.brandMark} />
          <Text style={styles.title}>{strings.setup.welcome}</Text>
          <Text style={styles.body}>{strings.setup.body}</Text>
        </View>

        <Card variant="panel" style={styles.permissionPanel}>
          <Pressable
            accessibilityRole="button"
            onPress={handleShareRowPress}
            style={({ pressed }) => [styles.permissionRow, pressed && styles.permissionRowPressed]}
          >
            <View style={styles.iconTile}>
              <Share color={colors.oxblood} size={18} strokeWidth={2} />
            </View>
            <View style={styles.rowCopy}>
              <Text style={styles.rowTitle}>{strings.setup.shareSheetTitle}</Text>
              <Text style={styles.rowSubtitle}>{strings.setup.shareSheetSubtitle}</Text>
            </View>
            {shareDone ? (
              <View style={styles.doneBadge} testID="share-done-badge">
                <Check color={colors.oxbloodFg} size={14} strokeWidth={2.5} />
              </View>
            ) : null}
          </Pressable>
          {Platform.OS === 'android' ? (
            <>
              <View style={styles.rowDivider} />
              <Pressable
                accessibilityRole="button"
                onPress={handleOverlayRowPress}
                style={({ pressed }) => [
                  styles.permissionRow,
                  pressed && styles.permissionRowPressed,
                ]}
              >
                <View style={styles.iconTile}>
                  <Layers color={colors.oxblood} size={18} strokeWidth={2} />
                </View>
                <View style={styles.rowCopy}>
                  <Text style={styles.rowTitle}>{strings.setup.overlayTitle}</Text>
                  <Text style={styles.rowSubtitle}>{strings.setup.overlaySubtitle}</Text>
                </View>
                {overlayDone ? (
                  <View style={styles.doneBadge} testID="overlay-done-badge">
                    <Check color={colors.oxbloodFg} size={14} strokeWidth={2.5} />
                  </View>
                ) : null}
              </Pressable>
            </>
          ) : null}
        </Card>

        <View style={styles.reassuranceRow}>
          <Lock color={colors.olive} size={16} strokeWidth={2} />
          <Text style={styles.reassuranceText}>{strings.setup.privacyReassurance}</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button size="lg" onPress={handleContinue} style={styles.continueButton}>
          {strings.setup.continue}
        </Button>
        <Button variant="text" onPress={handleSignIn} style={styles.signInButton}>
          {strings.setup.signIn}
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing[6],
    paddingTop: 34,
    paddingBottom: spacing[6],
  },
  brandBlock: {
    alignItems: 'center',
    marginBottom: spacing[6],
  },
  brandMark: {
    marginBottom: spacing[5],
  },
  title: {
    fontFamily: fonts.serif,
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: -0.56,
    color: colors.ink,
    textAlign: 'center',
    marginBottom: spacing[3],
  },
  body: {
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 21,
    color: colors.ink72,
    textAlign: 'center',
    maxWidth: 240,
  },
  permissionPanel: {
    borderRadius: 18,
    padding: 0,
    overflow: 'hidden',
    ...shadows.md,
  },
  permissionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
    gap: spacing[3],
  },
  permissionRowPressed: {
    backgroundColor: colors.paperSoft,
  },
  rowDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginLeft: 58,
  },
  iconTile: {
    width: 38,
    height: 38,
    borderRadius: radii.sm,
    backgroundColor: colors.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowCopy: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
    lineHeight: 18,
    color: colors.ink,
  },
  rowSubtitle: {
    fontFamily: fonts.sans,
    fontSize: 11.5,
    lineHeight: 16,
    color: colors.ink40,
  },
  doneBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.olive,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reassuranceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[2],
    marginTop: spacing[4],
    paddingHorizontal: spacing[1],
  },
  reassuranceText: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 12,
    lineHeight: 17,
    color: colors.ink55,
  },
  footer: {
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[6],
    paddingTop: spacing[3],
    gap: spacing[2],
  },
  continueButton: {
    alignSelf: 'stretch',
  },
  signInButton: {
    alignSelf: 'center',
  },
});
