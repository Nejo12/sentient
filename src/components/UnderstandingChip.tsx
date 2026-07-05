import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, radii, shadows, spacing } from '../theme/tokens';
import { fonts } from '../theme/typography';

type UnderstandingChipProps = {
  label: string;
  selected?: boolean;
  disabled?: boolean;
  onPress: () => void;
};

export function UnderstandingChip({
  label,
  selected = false,
  disabled = false,
  onPress,
}: UnderstandingChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled, selected }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.selected,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <Text style={[styles.label, selected && styles.selectedLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 46,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.paperStrong,
    paddingHorizontal: spacing[3],
    ...shadows.sm,
  },
  selected: {
    borderColor: colors.oxblood,
    backgroundColor: colors.soft,
  },
  pressed: {
    transform: [{ translateY: -1 }],
  },
  disabled: {
    opacity: 0.6,
  },
  label: {
    color: colors.ink,
    fontFamily: fonts.sansSemiBold,
    fontWeight: '600',
    fontSize: 13,
    lineHeight: 16,
    textAlign: 'center',
  },
  selectedLabel: {
    color: colors.oxblood,
  },
});
