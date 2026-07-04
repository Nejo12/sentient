import { StyleSheet, Text } from 'react-native';

import { strings } from '../constants/strings';
import { colors, radii, spacing } from '../theme/tokens';
import { fonts } from '../theme/typography';

interface PerspectiveCardProps {
  text: string;
}

export function PerspectiveCard({ text }: PerspectiveCardProps) {
  return (
    <>
      <Text style={styles.eyebrow}>{strings.compare.perspectiveEyebrow}</Text>
      <Text style={styles.body}>{text}</Text>
    </>
  );
}

const styles = StyleSheet.create({
  eyebrow: {
    color: colors.clay,
    fontFamily: fonts.sansSemiBold,
    fontWeight: '600',
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.35,
    backgroundColor: colors.soft,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderTopLeftRadius: radii.md,
    borderTopRightRadius: radii.md,
    borderBottomWidth: 0,
    paddingHorizontal: spacing[3],
    paddingTop: spacing[3],
  },
  body: {
    color: colors.ink72,
    fontFamily: fonts.sans,
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 22,
    backgroundColor: colors.soft,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderBottomLeftRadius: radii.md,
    borderBottomRightRadius: radii.md,
    paddingHorizontal: spacing[3],
    paddingBottom: spacing[3],
    paddingTop: spacing[1],
  },
});
