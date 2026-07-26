import { Check, Circle } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing } from '../../theme/tokens';
import { fonts } from '../../theme/typography';

const STEPS = ['Reading tone', 'Considering ambiguity', 'Preparing the clearest reply'];
const STEP_INTERVAL_MS = 850;

export function ProgressLoader() {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((current) => Math.min(current + 1, STEPS.length - 1));
    }, STEP_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);

  return (
    <View accessibilityLiveRegion="polite" style={styles.container}>
      <Text style={styles.title}>Understanding the message…</Text>
      <Text style={styles.body}>Considering context, ambiguity, and the clearest safe reply.</Text>

      <View style={styles.steps}>
        {STEPS.map((step, index) => {
          const complete = index < activeStep;
          const active = index === activeStep;

          return (
            <View key={step} style={styles.stepRow}>
              {complete ? (
                <Check color={colors.olive} size={16} strokeWidth={2.2} />
              ) : (
                <Circle color={active ? colors.clay : colors.ink55} size={12} strokeWidth={1.8} />
              )}
              <Text style={[styles.stepText, active && styles.activeStep, complete && styles.completeStep]}>
                {step}
              </Text>
            </View>
          );
        })}
      </View>

      <View style={styles.skeletonCard} testID="compare-skeleton-card">
        <View style={[styles.skeletonLine, styles.skeletonTitle]} />
        <View style={[styles.skeletonLine, styles.skeletonBody]} />
        <View style={[styles.skeletonLine, styles.skeletonBodyShort]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing[3],
    paddingVertical: spacing[5],
  },
  title: {
    color: colors.ink,
    fontFamily: fonts.sansSemiBold,
    fontWeight: '600',
    fontSize: 20,
    lineHeight: 26,
  },
  body: {
    color: colors.ink55,
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 19,
  },
  steps: {
    gap: spacing[2],
    paddingVertical: spacing[1],
  },
  stepRow: {
    minHeight: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  stepText: {
    color: colors.ink55,
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 18,
  },
  activeStep: {
    color: colors.ink,
    fontFamily: fonts.sansMedium,
    fontWeight: '500',
  },
  completeStep: {
    color: colors.olive,
  },
  skeletonCard: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.paperStrong,
    padding: spacing[4],
    gap: spacing[2],
  },
  skeletonLine: {
    borderRadius: radii.sm,
    backgroundColor: '#E5DDD2',
    height: 12,
  },
  skeletonTitle: {
    width: '44%',
    height: 14,
  },
  skeletonBody: {
    width: '100%',
  },
  skeletonBodyShort: {
    width: '84%',
  },
});