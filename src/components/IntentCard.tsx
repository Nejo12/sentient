import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii, shadows, spacing } from '../theme/tokens';
import { fonts } from '../theme/typography';

type IntentCardProps = {
  title: string;
  subtitle: string;
  selected?: boolean;
  disabled?: boolean;
  onPress: () => void;
};

export function IntentCard({
  title,
  subtitle,
  selected = false,
  disabled = false,
  onPress,
}: IntentCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled, selected }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        selected && styles.selected,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <View style={styles.textWrap}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 96,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.paperStrong,
    padding: spacing[4],
    ...shadows.sm,
  },
  selected: {
    backgroundColor: colors.soft,
    borderColor: 'rgba(156, 90, 68, 0.45)',
  },
  pressed: {
    transform: [{ translateY: -1 }],
  },
  disabled: {
    opacity: 0.6,
  },
  textWrap: {
    gap: spacing[2],
  },
  title: {
    color: colors.ink,
    fontFamily: fonts.sansSemiBold,
    fontWeight: '600',
    fontSize: 15,
    lineHeight: 20,
  },
  subtitle: {
    color: colors.ink55,
    fontFamily: fonts.sans,
    fontWeight: '400',
    fontSize: 13,
    lineHeight: 19,
  },
});
