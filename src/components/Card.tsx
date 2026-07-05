import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { colors, radii, shadows, spacing } from '../theme/tokens';

export type CardVariant = 'panel' | 'listItem' | 'productStage';

type CardProps = ViewProps & {
  variant?: CardVariant;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
};

const PRODUCT_SHADOW: ViewStyle = {
  shadowColor: 'rgb(47, 33, 29)',
  shadowOffset: { width: 0, height: 20 },
  shadowOpacity: 0.12,
  shadowRadius: 56,
  elevation: 12,
};

function ProductStageBackground() {
  return (
    <Svg pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Defs>
        <LinearGradient id="productStageGradient" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#fffcf9" stopOpacity={0.98} />
          <Stop offset="1" stopColor="#ece2da" stopOpacity={0.86} />
        </LinearGradient>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#productStageGradient)" />
    </Svg>
  );
}

export function Card({ variant = 'panel', style, children, ...viewProps }: CardProps) {
  if (variant === 'productStage') {
    return (
      <View style={[styles.productStage, PRODUCT_SHADOW, style]} {...viewProps}>
        <ProductStageBackground />
        <View style={styles.productStageContent}>{children}</View>
      </View>
    );
  }

  return (
    <View
      style={[variant === 'panel' ? styles.panel : styles.listItem, style]}
      {...viewProps}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: colors.paperStrong,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: spacing[4],
    ...shadows.md,
  },
  listItem: {
    backgroundColor: colors.paperStrong,
    borderRadius: radii.md,
    padding: spacing[4],
    ...shadows.sm,
  },
  productStage: {
    borderRadius: radii['2xl'],
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    overflow: 'hidden',
    padding: spacing[5],
  },
  productStageContent: {
    position: 'relative',
  },
});
