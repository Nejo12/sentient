import { router } from 'expo-router';
import { ArrowLeft, ArrowRight, Copy, Pencil } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../../src/components/Button';
import { Card } from '../../src/components/Card';
import { Pill } from '../../src/components/Pill';
import { Toast } from '../../src/components/Toast';
import { strings } from '../../src/constants/strings';
import { UNDERSTANDING_OPTIONS } from '../../src/constants/understanding';
import { saveRewrite } from '../../src/services/historyService';
import { useSessionStore } from '../../src/store/sessionStore';
import { useSettingsStore } from '../../src/store/settingsStore';
import { colors, radii, spacing } from '../../src/theme/tokens';
import { fonts } from '../../src/theme/typography';
import { copyToClipboard } from '../../src/utils/clipboard';

const TOAST_TIMEOUT_MS = 1300;
const WHATSAPP_URL = 'whatsapp://';

export default function SendBackScreen() {
  const {
    chosenReply,
    sourceApp,
    contactName,
    understanding,
    intent,
    setChosenReply,
  } = useSessionStore();
  const saveHistory = useSettingsStore((state) => state.saveHistory);
  const [draft, setDraft] = useState(chosenReply);
  const [isEditing, setIsEditing] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const toastTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (toastTimeout.current) {
        clearTimeout(toastTimeout.current);
      }
    },
    [],
  );

  const understandingLabel = useMemo(
    () =>
      UNDERSTANDING_OPTIONS.find((option) => option.key === understanding)?.label ??
      'Your reply',
    [understanding],
  );

  const appName = sourceApp.trim() || 'your chat app';

  const showCopiedToast = () => {
    setShowToast(true);

    if (toastTimeout.current) {
      clearTimeout(toastTimeout.current);
    }

    toastTimeout.current = setTimeout(() => {
      setShowToast(false);
    }, TOAST_TIMEOUT_MS);
  };

  const persistRewrite = async (text: string) => {
    if (!saveHistory || !intent) {
      return;
    }

    await saveRewrite({
      contactName,
      sourceApp,
      intent,
      understanding,
      fullText: text,
    });
  };

  const handleCopy = async () => {
    await copyToClipboard(draft);
    setChosenReply(draft);
    await persistRewrite(draft);
    showCopiedToast();
  };

  const handlePrimaryAction = async () => {
    await handleCopy();

    if (sourceApp.trim().toLowerCase() !== 'whatsapp') {
      Alert.alert(strings.sendBack.copiedToast, strings.sendBack.reassurance);
      return;
    }

    try {
      const canOpenWhatsApp = await Linking.canOpenURL(WHATSAPP_URL);
      if (canOpenWhatsApp) {
        await Linking.openURL(WHATSAPP_URL);
        return;
      }
    } catch {
      // Best-effort switch only; fallback keeps user in explicit control.
    }

    Alert.alert(strings.sendBack.copiedToast, strings.sendBack.reassurance);
  };

  const toggleEditing = () => {
    if (isEditing) {
      setChosenReply(draft);
    }

    setIsEditing((current) => !current);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft color={colors.ink55} size={16} strokeWidth={2} />
          </Pressable>
          <Text style={styles.headerTitle}>{strings.sendBack.readyToSend}</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.tagRow}>
          {intent === 'missing' ? (
            <Pill variant="accent">{strings.sendBack.perspectiveTag}</Pill>
          ) : (
            <Text style={styles.understandingLabel}>{understandingLabel}</Text>
          )}
        </View>

        <Card style={styles.previewCard} variant="productStage">
          <Pressable
            accessibilityLabel={isEditing ? 'Finish editing reply' : 'Edit reply'}
            accessibilityRole="button"
            onPress={toggleEditing}
            style={styles.editButton}
          >
            <Pencil color={colors.ink55} size={14} strokeWidth={1.9} />
          </Pressable>

          {isEditing ? (
            <TextInput
              multiline
              onChangeText={setDraft}
              style={styles.previewInput}
              value={draft}
            />
          ) : (
            <Text style={styles.previewText}>{draft}</Text>
          )}
        </Card>

        {showToast ? <Toast message={strings.sendBack.copiedToast} /> : null}

        <Button
          icon={<Copy color={colors.ink72} size={14} strokeWidth={1.9} />}
          onPress={() => void handleCopy()}
          size="sm"
          style={styles.copyButton}
          variant="secondary"
        >
          {strings.compare.copy}
        </Button>

        <Text style={styles.reassurance}>{strings.sendBack.reassurance}</Text>

        <View style={styles.actionStack}>
          <Button
            icon={<ArrowRight color={colors.oxbloodFg} size={14} strokeWidth={2} />}
            onPress={() => void handlePrimaryAction()}
            size="lg"
            style={styles.fullWidthButton}
            variant="primary"
          >
            {strings.sendBack.copyAndSwitch(appName)}
          </Button>
          <Button
            onPress={() => router.back()}
            size="lg"
            style={styles.fullWidthButton}
            variant="ghost"
          >
            {strings.sendBack.backToOptions}
          </Button>
        </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
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
    color: colors.ink,
    fontFamily: fonts.sansSemiBold,
    fontWeight: '600',
    fontSize: 17,
    lineHeight: 24,
  },
  headerSpacer: {
    width: 32,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  understandingLabel: {
    color: colors.clay,
    fontFamily: fonts.sansSemiBold,
    fontWeight: '600',
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.24,
  },
  previewCard: {
    position: 'relative',
    paddingTop: spacing[6],
  },
  editButton: {
    position: 'absolute',
    top: spacing[3],
    right: spacing[3],
    width: 32,
    height: 32,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  previewText: {
    color: colors.ink,
    fontFamily: fonts.serif,
    fontSize: 16,
    lineHeight: 27,
  },
  previewInput: {
    color: colors.ink,
    fontFamily: fonts.serif,
    fontSize: 16,
    lineHeight: 27,
    padding: 0,
    minHeight: 144,
    textAlignVertical: 'top',
  },
  copyButton: {
    alignSelf: 'flex-start',
  },
  reassurance: {
    color: colors.ink55,
    fontFamily: fonts.sans,
    fontWeight: '400',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
  actionStack: {
    marginTop: spacing[2],
    gap: spacing[2],
  },
  fullWidthButton: {
    width: '100%',
  },
});
