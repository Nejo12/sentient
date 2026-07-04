import { Check } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing } from '../theme/tokens';
import { fonts } from '../theme/typography';

interface ToastProps {
  message: string;
}

export function Toast({ message }: ToastProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Check color={colors.paperStrong} size={13} strokeWidth={2.2} />
      </View>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(124, 120, 56, 0.3)',
    backgroundColor: colors.oliveSoft,
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
  },
  iconWrap: {
    width: 22,
    height: 22,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.olive,
  },
  message: {
    color: colors.olive,
    fontFamily: fonts.sansSemiBold,
    fontWeight: '600',
    fontSize: 13,
    lineHeight: 17,
  },
});
