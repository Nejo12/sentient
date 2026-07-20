import { ChevronDown, ChevronUp } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { LayoutAnimation, Platform, Pressable, StyleSheet, Text, UIManager, View } from 'react-native';

import { colors, radii, spacing } from '../../theme/tokens';
import { fonts } from '../../theme/typography';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface DisclosureSectionProps {
  children: ReactNode;
  closedLabel: string;
  openLabel: string;
  expanded: boolean;
  onToggle: () => void;
  testID?: string;
}

export function DisclosureSection({
  children,
  closedLabel,
  openLabel,
  expanded,
  onToggle,
  testID,
}: DisclosureSectionProps) {
  const toggle = () => {
    LayoutAnimation.configureNext({
      duration: 190,
      create: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity,
      },
      update: {
        type: LayoutAnimation.Types.easeInEaseOut,
      },
      delete: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity,
      },
    });
    onToggle();
  };

  const label = expanded ? openLabel : closedLabel;

  return (
    <View style={styles.container} testID={testID}>
      <Pressable
        accessibilityHint={expanded ? 'Collapses this section' : 'Expands this section'}
        accessibilityLabel={label}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        hitSlop={6}
        onPress={toggle}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      >
        <Text style={styles.label}>{label}</Text>
        {expanded ? (
          <ChevronUp color={colors.oxblood} size={18} strokeWidth={2} />
        ) : (
          <ChevronDown color={colors.oxblood} size={18} strokeWidth={2} />
        )}
      </Pressable>
      {expanded ? <View style={styles.content}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing[3],
  },
  button: {
    minHeight: 48,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.paperSoft,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[1],
    paddingHorizontal: spacing[3],
  },
  pressed: {
    opacity: 0.76,
    transform: [{ scale: 0.99 }],
  },
  label: {
    color: colors.oxblood,
    fontFamily: fonts.sansSemiBold,
    fontWeight: '600',
    fontSize: 13,
    lineHeight: 18,
  },
  content: {
    opacity: 1,
  },
});