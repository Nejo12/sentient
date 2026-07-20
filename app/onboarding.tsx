import { router } from 'expo-router';
import { Check, ChevronLeft, ChevronRight, Lock, MessageCircle, ShieldCheck, Sparkles } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '../src/components/Card';
import { colors, radii, shadows, spacing } from '../src/theme/tokens';
import { fonts } from '../src/theme/typography';

const steps = [
  {
    eyebrow: 'See more than one meaning',
    title: 'A short message can carry several possible meanings.',
    body: 'Sentient helps you pause before reacting to the first interpretation that comes to mind.',
  },
  {
    eyebrow: 'Understand before replying',
    title: 'Look at the message from more than one angle.',
    body: 'Possible meanings are shown as interpretations, not facts about what another person thinks or feels.',
  },
  {
    eyebrow: 'Choose a clear response',
    title: 'Get one recommended reply first.',
    body: 'You can use it immediately or open deeper reasoning and alternative approaches only when you need them.',
  },
  {
    eyebrow: 'Private by design',
    title: 'You decide what Sentient can read.',
    body: 'Sentient only works with text you deliberately paste or share. It does not monitor your conversations.',
  },
  {
    eyebrow: 'Ready when needed',
    title: 'Set up the fastest route from a conversation to a clearer reply.',
    body: 'You can configure sharing now and adjust your preferences later from Settings.',
  },
] as const;

export default function OnboardingScreen() {
  const [step, setStep] = useState(0);
  const [selectedMeaning, setSelectedMeaning] = useState(0);
  const current = steps[step];
  const finalStep = step === steps.length - 1;

  const progressLabel = useMemo(() => `${step + 1} of ${steps.length}`, [step]);

  const continueForward = () => {
    if (finalStep) {
      router.replace('/setup');
      return;
    }

    setStep((currentStep) => currentStep + 1);
  };

  const goBack = () => {
    if (step === 0) {
      router.replace('/');
      return;
    }

    setStep((currentStep) => currentStep - 1);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable accessibilityLabel="Go back" accessibilityRole="button" onPress={goBack} style={styles.iconButton}>
          <ChevronLeft color={colors.ink55} size={20} strokeWidth={2} />
        </Pressable>
        <Text style={styles.progress}>{progressLabel}</Text>
        <View style={styles.iconSpacer} />
      </View>

      <View style={styles.content}>
        <View style={styles.copyBlock}>
          <Text style={styles.eyebrow}>{current.eyebrow}</Text>
          <Text style={styles.title}>{current.title}</Text>
          <Text style={styles.body}>{current.body}</Text>
        </View>

        {step === 0 ? (
          <View style={styles.exampleStack}>
            <Card variant="panel" style={styles.messageCard}>
              <View style={styles.messageHeader}>
                <MessageCircle color={colors.oxblood} size={18} strokeWidth={2} />
                <Text style={styles.messageLabel}>Message</Text>
              </View>
              <Text style={styles.messageText}>Okay.</Text>
            </Card>
            <View style={styles.outcomeGrid}>
              {['Agreement', 'Disappointment', 'Distance', 'Uncertainty'].map((label, index) => {
                const selected = selectedMeaning === index;
                return (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    key={label}
                    onPress={() => setSelectedMeaning(index)}
                    style={[styles.outcome, selected && styles.outcomeSelected]}
                  >
                    <Text style={styles.outcomeText}>{label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}

        {step === 1 ? (
          <View style={styles.flowStack}>
            <Card variant="panel" style={styles.flowCard}>
              <MessageCircle color={colors.oxblood} size={18} strokeWidth={2} />
              <Text style={styles.flowText}>Original message</Text>
            </Card>
            <Text style={styles.arrow}>↓</Text>
            <Card variant="panel" style={styles.flowCard}>
              <Sparkles color={colors.oxblood} size={18} strokeWidth={2} />
              <Text style={styles.flowText}>Possible interpretations</Text>
            </Card>
            <Text style={styles.arrow}>↓</Text>
            <Card variant="panel" style={styles.flowCard}>
              <ShieldCheck color={colors.oxblood} size={18} strokeWidth={2} />
              <Text style={styles.flowText}>Uncertainty and risks</Text>
            </Card>
          </View>
        ) : null}

        {step === 2 ? (
          <Card variant="panel" style={styles.replyCard}>
            <Text style={styles.replyLabel}>Suggested reply</Text>
            <Text style={styles.replyText}>Thanks for saying that clearly. I want to understand what you need before I respond.</Text>
            <Text style={styles.replyReason}>Acknowledges the message without assuming intent.</Text>
          </Card>
        ) : null}

        {step === 3 ? (
          <View style={styles.privacyStack}>
            <View style={styles.privacyRow}>
              <Lock color={colors.oxblood} size={20} strokeWidth={2} />
              <Text style={styles.privacyText}>Only text you explicitly paste or share is analysed.</Text>
            </View>
            <View style={styles.privacyRow}>
              <ShieldCheck color={colors.oxblood} size={20} strokeWidth={2} />
              <Text style={styles.privacyText}>Sentient never sends a message without your action.</Text>
            </View>
            <View style={styles.privacyRow}>
              <Check color={colors.oxblood} size={20} strokeWidth={2} />
              <Text style={styles.privacyText}>Saved history can be disabled in Settings.</Text>
            </View>
          </View>
        ) : null}

        {step === 4 ? (
          <View style={styles.finishStack}>
            <Sparkles color={colors.oxblood} size={30} strokeWidth={1.8} />
            <Text style={styles.finishTitle}>Sentient is ready to help you communicate with clarity.</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.footer}>
        <Pressable accessibilityRole="button" onPress={continueForward} style={({ pressed }) => [styles.continueButton, pressed && styles.pressed]}>
          <Text style={styles.continueText}>{finalStep ? 'Set up Sentient' : 'Continue'}</Text>
          <ChevronRight color={colors.oxbloodFg} size={18} strokeWidth={2} />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.paper },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing[4], paddingTop: spacing[2] },
  iconButton: { width: 44, height: 44, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center' },
  iconSpacer: { width: 44 },
  progress: { color: colors.ink40, fontFamily: fonts.sansMedium, fontSize: 12 },
  content: { flex: 1, paddingHorizontal: spacing[6], paddingTop: spacing[4] },
  copyBlock: { gap: spacing[2], marginBottom: spacing[5] },
  eyebrow: { color: colors.oxblood, fontFamily: fonts.sansSemiBold, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.7 },
  title: { color: colors.ink, fontFamily: fonts.serif, fontSize: 31, lineHeight: 38 },
  body: { color: colors.ink55, fontFamily: fonts.sans, fontSize: 15, lineHeight: 23 },
  exampleStack: { gap: spacing[4] },
  messageCard: { padding: spacing[5], gap: spacing[3] },
  messageHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  messageLabel: { color: colors.oxblood, fontFamily: fonts.sansSemiBold, fontSize: 12, textTransform: 'uppercase' },
  messageText: { color: colors.ink, fontFamily: fonts.serif, fontSize: 34, lineHeight: 42 },
  flowStack: { gap: spacing[2] },
  flowCard: { padding: spacing[4], flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  flowText: { color: colors.ink, fontFamily: fonts.sansSemiBold, fontSize: 15 },
  arrow: { color: colors.ink40, textAlign: 'center', fontSize: 22, lineHeight: 30 },
  outcomeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[3], marginBottom: spacing[5] },
  outcome: { width: '47%', minHeight: 48, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.paperSoft },
  outcomeSelected: { borderColor: colors.oxblood, backgroundColor: colors.soft },
  outcomeText: { color: colors.ink, fontFamily: fonts.sansSemiBold, fontSize: 14 },
  replyCard: { padding: spacing[5], gap: spacing[3], ...shadows.md },
  replyLabel: { color: colors.oxblood, fontFamily: fonts.sansSemiBold, fontSize: 12, textTransform: 'uppercase' },
  replyText: { color: colors.ink, fontFamily: fonts.sansMedium, fontSize: 16, lineHeight: 23 },
  replyReason: { color: colors.ink55, fontFamily: fonts.sans, fontSize: 12.5, lineHeight: 18 },
  privacyStack: { gap: spacing[4], marginVertical: spacing[8] },
  privacyRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing[3] },
  privacyText: { flex: 1, color: colors.ink72, fontFamily: fonts.sans, fontSize: 15, lineHeight: 22 },
  finishStack: { alignItems: 'center', gap: spacing[4], paddingTop: spacing[8] },
  finishTitle: { color: colors.ink, fontFamily: fonts.serif, fontSize: 25, lineHeight: 31, textAlign: 'center', marginTop: spacing[5] },
  footer: { paddingHorizontal: spacing[6], paddingBottom: spacing[5], paddingTop: spacing[3] },
  continueButton: { minHeight: 52, borderRadius: radii.pill, backgroundColor: colors.oxblood, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing[2] },
  continueText: { color: colors.oxbloodFg, fontFamily: fonts.sansSemiBold, fontSize: 15 },
  pressed: { opacity: 0.85 },
});
