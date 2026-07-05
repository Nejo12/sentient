import { Heart, MessageCircle } from 'lucide-react-native';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors } from '../theme/tokens';

type BrandMarkProps = {
  size?: number;
  style?: StyleProp<ViewStyle>;
};

export function BrandMark({ size = 30, style }: BrandMarkProps) {
  const iconSize = Math.max(12, Math.round(size * 0.48));
  const heartSize = Math.max(9, Math.round(size * 0.3));

  return (
    <View style={[styles.tile, { width: size, height: size, borderRadius: Math.round(size * 0.33) }, style]}>
      <MessageCircle color={colors.oxbloodFg} size={iconSize} strokeWidth={1.9} />
      <View style={styles.heartWrap}>
        <Heart color={colors.oxbloodFg} fill={colors.oxbloodFg} size={heartSize} strokeWidth={2} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.oxblood,
    shadowColor: colors.oxbloodStrong,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 26,
    elevation: 8,
    overflow: 'hidden',
  },
  heartWrap: {
    position: 'absolute',
    right: 5,
    bottom: 4,
  },
});
