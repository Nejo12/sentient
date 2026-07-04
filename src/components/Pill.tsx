import type { ReactNode } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';
import { colors, spacing } from '../theme/tokens';
import { fonts } from '../theme/typography';

export type PillVariant = 'accent' | 'success' | 'neutral';

type PillProps = ViewProps & {
  variant?: PillVariant;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
};

export function Pill({ variant = 'accent', style, children, ...viewProps }: PillProps) {
  const showDot = variant !== 'neutral';

  return (
    <View style={[styles.base, variantStyles[variant], style]} {...viewProps}>
      {showDot ? <View style={[styles.dot, { backgroundColor: dotColor[variant] }]} /> : null}
      <Text style={[styles.label, labelStyles[variant]]}>{children}</Text>
    </View>
  );
}

const variantStyles = StyleSheet.create({
  accent: {
    backgroundColor: colors.soft,
  },
  success: {
    backgroundColor: colors.oliveSoft,
  },
  neutral: {
    backgroundColor: 'transparent',
    borderColor: colors.border,
    paddingVertical: 3,
  },
});

const labelStyles = StyleSheet.create({
  accent: {
    color: colors.clay,
  },
  success: {
    color: colors.olive,
  },
  neutral: {
    color: colors.ink55,
  },
});

const dotColor: Record<Exclude<PillVariant, 'neutral'>, string> = {
  accent: colors.clay,
  success: colors.olive,
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'transparent',
    paddingVertical: spacing[1],
    paddingHorizontal: spacing[2],
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    opacity: 0.7,
  },
  label: {
    fontFamily: fonts.sansMedium,
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 11,
  },
});
