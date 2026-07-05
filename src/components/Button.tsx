import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import { colors, radii, shadows, spacing } from '../theme/tokens';
import { fonts } from '../theme/typography';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'text';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

type ButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  onPress?: () => void;
  disabled?: boolean;
  children: ReactNode;
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

const SIZE_STYLES: Record<
  ButtonSize,
  { minHeight: number; paddingVertical: number; paddingHorizontal: number; fontSize: number; tracking: number }
> = {
  xs: { minHeight: 32, paddingVertical: 6, paddingHorizontal: spacing[3], fontSize: 11, tracking: 0.12 },
  sm: { minHeight: 40, paddingVertical: spacing[2], paddingHorizontal: spacing[4], fontSize: 12, tracking: 0.12 },
  md: { minHeight: 48, paddingVertical: spacing[3], paddingHorizontal: spacing[6], fontSize: 14, tracking: 0.12 },
  lg: { minHeight: 52, paddingVertical: 14, paddingHorizontal: 28, fontSize: 15, tracking: 0.14 },
};

function variantStyles(variant: ButtonVariant, pressed: boolean, disabled: boolean) {
  switch (variant) {
    case 'primary':
      return {
        container: [
          styles.primary,
          pressed && !disabled && styles.primaryPressed,
          disabled && styles.disabled,
        ],
        label: styles.primaryLabel,
      };
    case 'secondary':
      return {
        container: [
          styles.secondary,
          pressed && !disabled && styles.secondaryPressed,
          disabled && styles.disabled,
        ],
        label: styles.secondaryLabel,
      };
    case 'ghost':
      return {
        container: [
          styles.ghost,
          pressed && !disabled && styles.ghostPressed,
          disabled && styles.disabled,
        ],
        label: styles.ghostLabel,
      };
    case 'text':
      return {
        container: [styles.textVariant, pressed && !disabled && styles.textPressed, disabled && styles.disabled],
        label: styles.textLabel,
      };
  }
}

export function Button({
  variant = 'primary',
  size = 'md',
  onPress,
  disabled = false,
  children,
  icon,
  style,
  ...pressableProps
}: ButtonProps) {
  const sizeStyle = SIZE_STYLES[size];
  const isText = variant === 'text';

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        !isText && styles.pill,
        {
          minHeight: isText ? undefined : sizeStyle.minHeight,
          paddingVertical: isText ? spacing[1] : sizeStyle.paddingVertical,
          paddingHorizontal: isText ? 0 : sizeStyle.paddingHorizontal,
        },
        ...variantStyles(variant, pressed, disabled).container,
        style,
      ]}
      {...pressableProps}
    >
      {({ pressed }) => (
        <>
          {icon ? <View style={styles.icon}>{icon}</View> : null}
          <Text
            style={[
              styles.label,
              variantStyles(variant, pressed, disabled).label,
              isText && pressed && !disabled && styles.textLabelPressed,
              {
                fontSize: sizeStyle.fontSize,
                letterSpacing: isText ? 0 : sizeStyle.fontSize * sizeStyle.tracking,
              },
            ]}
          >
            {children}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    borderWidth: 1,
    borderColor: 'transparent',
  },
  pill: {
    borderRadius: radii.pill,
  },
  label: {
    fontFamily: fonts.sansSemiBold,
    fontWeight: '600',
    textAlign: 'center',
  },
  icon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: colors.oxblood,
    ...shadows.md,
  },
  primaryPressed: {
    backgroundColor: colors.oxbloodStrong,
  },
  primaryLabel: {
    color: colors.oxbloodFg,
  },
  secondary: {
    backgroundColor: 'rgba(239, 234, 225, 0.5)',
    borderColor: colors.borderStrong,
  },
  secondaryPressed: {
    backgroundColor: colors.paperStrong,
  },
  secondaryLabel: {
    color: colors.ink,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  ghostPressed: {
    backgroundColor: 'rgba(239, 234, 225, 0.5)',
    borderColor: colors.borderStrong,
  },
  ghostLabel: {
    color: colors.ink72,
  },
  textVariant: {
    backgroundColor: 'transparent',
    borderRadius: 0,
    alignSelf: 'flex-start',
  },
  textPressed: {
    opacity: 0.85,
  },
  textLabel: {
    color: colors.oxblood,
  },
  textLabelPressed: {
    textDecorationLine: 'underline',
    textDecorationColor: colors.oxblood,
  },
  disabled: {
    opacity: 0.6,
  },
});
