import Svg, { Circle, Path } from 'react-native-svg';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors } from '../theme/tokens';
import { fonts } from '../theme/typography';

type BrandMarkProps = {
  size?: number;
  style?: StyleProp<ViewStyle>;
  showShadow?: boolean;
};

type BrandLockupProps = {
  markSize?: number;
  style?: StyleProp<ViewStyle>;
  tagline?: string;
};

export function BrandMark({ size = 30, style, showShadow = true }: BrandMarkProps) {
  const radius = Math.round(size * 0.28);

  return (
    <View
      accessibilityLabel="Sentient"
      style={[
        styles.tile,
        showShadow && styles.tileShadow,
        { width: size, height: size, borderRadius: radius },
        style,
      ]}
    >
      <Svg height={size} viewBox="0 0 100 100" width={size}>
        <Path
          d="M28.5 38C33.7 30.8 41 27.2 50.5 27.2C60 27.2 67.3 30.8 72.5 38"
          fill="none"
          stroke={colors.oxbloodFg}
          strokeLinecap="round"
          strokeWidth="9"
        />
        <Path
          d="M28.5 62C33.7 69.2 41 72.8 50.5 72.8C60 72.8 67.3 69.2 72.5 62"
          fill="none"
          stroke={colors.oxbloodFg}
          strokeLinecap="round"
          strokeWidth="9"
        />
        <Circle cx="50.5" cy="50" fill={colors.paper} r="4.4" />
      </Svg>
    </View>
  );
}

export function BrandLockup({ markSize = 42, style, tagline }: BrandLockupProps) {
  return (
    <View style={[styles.lockup, style]}>
      <BrandMark size={markSize} />
      <View style={styles.lockupCopy}>
        <Text style={styles.wordmark}>Sentient</Text>
        {tagline ? <Text style={styles.tagline}>{tagline}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.oxblood,
    overflow: 'hidden',
  },
  tileShadow: {
    shadowColor: colors.oxbloodStrong,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.32,
    shadowRadius: 20,
    elevation: 7,
  },
  lockup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  lockupCopy: {
    gap: 1,
  },
  wordmark: {
    color: colors.ink,
    fontFamily: fonts.serif,
    fontSize: 25,
    lineHeight: 29,
    letterSpacing: -0.4,
  },
  tagline: {
    color: colors.ink55,
    fontFamily: fonts.sans,
    fontSize: 11.5,
    lineHeight: 16,
  },
});
