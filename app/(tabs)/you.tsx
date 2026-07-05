import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { Check, ChevronRight, Heart, Sparkles } from 'lucide-react-native';

import { Card } from '../../src/components/Card';
import { Toggle } from '../../src/components/Toggle';
import { strings } from '../../src/constants/strings';
import { UNDERSTANDING_OPTIONS } from '../../src/constants/understanding';
import { presentPaywall } from '../../src/services/entitlements';
import { useSettingsStore } from '../../src/store/settingsStore';
import { colors, radii, shadows, spacing } from '../../src/theme/tokens';
import { fonts } from '../../src/theme/typography';
import type { Understanding } from '../../src/types/rewrite';

function ProCardBackground() {
  return (
    <Svg pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Defs>
        <LinearGradient id="proGradient" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={colors.oxblood} stopOpacity={1} />
          <Stop offset="1" stopColor={colors.oxbloodStrong} stopOpacity={1} />
        </LinearGradient>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#proGradient)" />
    </Svg>
  );
}

export default function YouScreen() {
  const {
    defaultUnderstanding,
    editBeforeSend,
    saveHistory,
    hydrate,
    setDefaultUnderstanding,
    setEditBeforeSend,
    setSaveHistory,
  } = useSettingsStore();

  const [pickerVisible, setPickerVisible] = useState(false);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const selectedLabel = useMemo(
    () =>
      UNDERSTANDING_OPTIONS.find((option) => option.key === defaultUnderstanding)?.label ??
      'Calm',
    [defaultUnderstanding],
  );

  const handleSelectUnderstanding = useCallback(
    async (value: Understanding) => {
      await setDefaultUnderstanding(value);
      setPickerVisible(false);
    },
    [setDefaultUnderstanding],
  );

  const handleGoPro = useCallback(() => {
    void presentPaywall();
  }, []);

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>{strings.settings.title}</Text>

        <Text style={styles.sectionHeading}>{strings.settings.defaults}</Text>
        <Card variant="panel" style={styles.card}>
          <Pressable
            accessibilityLabel={strings.settings.defaultUnderstanding}
            accessibilityRole="button"
            onPress={() => setPickerVisible(true)}
            style={({ pressed }) => [styles.settingsRow, pressed && styles.rowPressed]}
          >
            <View style={styles.iconTile}>
              <Heart color={colors.oxblood} size={18} strokeWidth={2} />
            </View>
            <View style={styles.rowCopy}>
              <Text style={styles.rowTitle}>{strings.settings.defaultUnderstanding}</Text>
            </View>
            <Text style={styles.rowValue}>{selectedLabel}</Text>
            <ChevronRight color={colors.ink40} size={18} strokeWidth={1.9} />
          </Pressable>
        </Card>

        <Text style={styles.sectionHeading}>{strings.settings.beforeAnythingSends}</Text>
        <Card variant="panel" style={styles.card}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleCopy}>
              <Text style={styles.rowTitle}>{strings.settings.editBeforeSend}</Text>
              <Text style={styles.rowSubtitle}>{strings.settings.editBeforeSendSubtitle}</Text>
            </View>
            <Toggle
              accessibilityLabel={strings.settings.editBeforeSend}
              onValueChange={(value) => {
                void setEditBeforeSend(value);
              }}
              value={editBeforeSend}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.toggleRow}>
            <View style={styles.toggleCopy}>
              <Text style={styles.rowTitle}>{strings.settings.saveHistory}</Text>
              <Text style={styles.rowSubtitle}>{strings.settings.saveHistorySubtitle}</Text>
            </View>
            <Toggle
              accessibilityLabel={strings.settings.saveHistory}
              onValueChange={(value) => {
                void setSaveHistory(value);
              }}
              value={saveHistory}
            />
          </View>
        </Card>

        <View style={styles.proCard}>
          <ProCardBackground />
          <View style={styles.proContent}>
            <View style={styles.proHeader}>
              <Sparkles color={colors.oxbloodFg} size={16} strokeWidth={2} />
              <Text style={styles.proTitle}>{strings.settings.proTitle}</Text>
            </View>
            <Text style={styles.proBody}>{strings.settings.proBody}</Text>
            <View style={styles.proFooter}>
              <Pressable
                accessibilityRole="button"
                onPress={handleGoPro}
                style={({ pressed }) => [styles.proButton, pressed && styles.rowPressed]}
              >
                <Text style={styles.proButtonLabel}>{strings.settings.proCta}</Text>
              </Pressable>
              <Text style={styles.proPrice}>{strings.settings.proPrice}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <Modal
        animationType="slide"
        onRequestClose={() => setPickerVisible(false)}
        transparent
        visible={pickerVisible}
      >
        <Pressable
          accessibilityLabel="Close understanding picker"
          accessibilityRole="button"
          onPress={() => setPickerVisible(false)}
          style={styles.modalBackdrop}
        >
          <Pressable onPress={(event) => event.stopPropagation()} style={styles.modalSheet}>
            <Text style={styles.modalTitle}>{strings.settings.defaultUnderstanding}</Text>
            {UNDERSTANDING_OPTIONS.map((option) => {
              const selected = option.key === defaultUnderstanding;

              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  key={option.key}
                  onPress={() => {
                    void handleSelectUnderstanding(option.key);
                  }}
                  style={({ pressed }) => [
                    styles.modalOption,
                    selected && styles.modalOptionSelected,
                    pressed && styles.rowPressed,
                  ]}
                >
                  <Text style={[styles.modalOptionLabel, selected && styles.modalOptionLabelSelected]}>
                    {option.label}
                  </Text>
                  {selected ? <Check color={colors.oxblood} size={18} strokeWidth={2.5} /> : null}
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: spacing[4],
    paddingBottom: spacing[8],
  },
  title: {
    color: colors.ink,
    fontFamily: fonts.sansSemiBold,
    fontWeight: '600',
    fontSize: 22,
    lineHeight: 28,
  },
  sectionHeading: {
    color: colors.clay,
    fontFamily: fonts.sansSemiBold,
    fontWeight: '600',
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.22,
    textTransform: 'uppercase',
    marginTop: spacing[5],
    marginBottom: spacing[2],
  },
  card: {
    paddingVertical: 0,
    paddingHorizontal: 0,
    overflow: 'hidden',
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
  },
  rowPressed: {
    opacity: 0.92,
  },
  iconTile: {
    width: 34,
    height: 34,
    borderRadius: radii.sm,
    backgroundColor: colors.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowCopy: {
    flex: 1,
  },
  rowTitle: {
    color: colors.ink,
    fontFamily: fonts.sansSemiBold,
    fontWeight: '600',
    fontSize: 15,
    lineHeight: 20,
  },
  rowSubtitle: {
    color: colors.ink55,
    fontFamily: fonts.sans,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  rowValue: {
    color: colors.ink40,
    fontFamily: fonts.sansMedium,
    fontWeight: '500',
    fontSize: 13,
    lineHeight: 18,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
  },
  toggleCopy: {
    flex: 1,
    paddingRight: spacing[2],
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: spacing[4],
  },
  proCard: {
    marginTop: spacing[5],
    borderRadius: radii.lg,
    overflow: 'hidden',
    ...shadows.md,
  },
  proContent: {
    padding: spacing[5],
    gap: spacing[3],
  },
  proHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  proTitle: {
    color: colors.oxbloodFg,
    fontFamily: fonts.serif,
    fontSize: 22,
    lineHeight: 26,
  },
  proBody: {
    color: 'rgba(255, 255, 255, 0.88)',
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 20,
  },
  proFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  proButton: {
    minHeight: 40,
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[2],
    borderRadius: radii.pill,
    backgroundColor: colors.paperStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  proButtonLabel: {
    color: colors.oxblood,
    fontFamily: fonts.sansSemiBold,
    fontWeight: '600',
    fontSize: 12,
    letterSpacing: 1.44,
  },
  proPrice: {
    color: colors.oxbloodFg,
    fontFamily: fonts.sansMedium,
    fontWeight: '500',
    fontSize: 13,
    lineHeight: 18,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(43, 37, 33, 0.42)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.paperStrong,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingHorizontal: spacing[5],
    paddingTop: spacing[5],
    paddingBottom: spacing[8],
    gap: spacing[2],
  },
  modalTitle: {
    color: colors.ink,
    fontFamily: fonts.sansSemiBold,
    fontWeight: '600',
    fontSize: 18,
    lineHeight: 24,
    marginBottom: spacing[2],
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    backgroundColor: colors.paperStrong,
  },
  modalOptionSelected: {
    borderColor: colors.oxblood,
    backgroundColor: colors.soft,
  },
  modalOptionLabel: {
    color: colors.ink,
    fontFamily: fonts.sansSemiBold,
    fontWeight: '600',
    fontSize: 15,
    lineHeight: 20,
  },
  modalOptionLabelSelected: {
    color: colors.oxblood,
  },
});
