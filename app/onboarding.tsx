import { router } from 'expo-router';
import { Check, Lock, MessageCircleQuestion, ShieldCheck } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../src/components/Button';
import { Card } from '../src/components/Card';
import { setOnboardingComplete } from '../src/services/onboardingStorage';
import { colors, radii, shadows, spacing } from '../src/theme/tokens';
import { fonts } from '../src/theme/typography';

const TOTAL_STEPS = 5;
const ambiguityChoices = ['They agree', "They're upset", "They don't care", "I'm not sure"];
const outcomeChoices = ['Calm', 'Curious', 'Professional', 'Firm'];

export default function OnboardingScreen() {
  const [step, setStep] = useState(0);
  const [ambiguityChoice, setAmbiguityChoice] = useState<string | null>(null);
  const [outcome, setOutcome] = useState('Calm');

  const sampleReply = useMemo(() => {
    switch (outcome) {
      case 'Curious':
        return 'I may be reading too much into “Okay”. What did you mean by it?';
      case 'Professional':
        return 'Thanks. Before I proceed, could you confirm that this works for you?';
      case 'Firm':
        return 'I need a clearer answer before I make a decision.';
      default:
        return 'I want to make sure I understood you. Are we okay?';
    }
  }, [outcome]);

  const finish = useCallback(async () => {
    await setOnboardingComplete();
    router.replace('/setup');
  }, []);

  const next = useCallback(() => {
    if (step === TOTAL_STEPS - 1) {
      void finish();
      return;
    }
    setStep((current) => current + 1);
  }, [finish, step]);

  const skip = useCallback(() => {
    void finish();
  }, [finish]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <View style={styles.progress}>
          {Array.from({ length: TOTAL_STEPS }).map((_, index) => (
            <View key={index} style={[styles.dot, index <= step && styles.dotActive]} />
          ))}
        </View>
        <Pressable accessibilityRole="button" onPress={skip}>
          <Text style={styles.skip}>Skip</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {step === 0 ? (
          <>
            <Text style={styles.title}>Words aren’t always the whole message.</Text>
            <Card style={styles.messageCard} variant="panel">
              <Text style={styles.message}>Okay.</Text>
            </Card>
            <Text style={styles.question}>What do you think they meant?</Text>
            <View style={styles.choiceStack}>
              {ambiguityChoices.map((choice) => (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: ambiguityChoice === choice }}
                  key={choice}
                  onPress={() => setAmbiguityChoice(choice)}
                  style={[styles.choice, ambiguityChoice === choice && styles.choiceSelected]}
                >
                  <Text style={styles.choiceText}>{choice}</Text>
                  {ambiguityChoice === choice ? <Check color={colors.oxblood} size={18} /> : null}
                </Pressable>
              ))}
            </View>
          </>
        ) : null}

        {step === 1 ? (
          <>
            <Text style={styles.title}>Every one of those could be true.</Text>
            <Text style={styles.body}>Words tell only part of the story. Context fills the rest.</Text>
            <View style={styles.meaningStack}>
              {ambiguityChoices.map((choice) => (
                <View key={choice} style={styles.meaningRow}>
                  <Check color={colors.olive} size={18} />
                  <Text style={styles.meaningText}>{choice}</Text>
                </View>
              ))}
            </View>
          </>
        ) : null}

        {step === 2 ? (
          <>
            <Text style={styles.title}>Sentient doesn’t guess.</Text>
            <Text style={styles.body}>It helps you think before you reply.</Text>
            <View style={styles.flowStack}>
              {['Original message', 'Possible meanings', 'What we cannot know', 'Suggested replies'].map((label, index) => (
                <View key={label}>
                  <Card style={styles.flowCard} variant="panel">
                    <MessageCircleQuestion color={colors.oxblood} size={18} />
                    <Text style={styles.flowText}>{label}</Text>
                  </Card>
                  {index < 3 ? <Text style={styles.arrow}>↓</Text> : null}
                </View>
              ))}
            </View>
          </>
        ) : null}

        {step === 3 ? (
          <>
            <Text style={styles.title}>Choose your outcome.</Text>
            <Text style={styles.body}>The same message needs a different reply depending on what you want to achieve.</Text>
            <View style={styles.outcomeGrid}>
              {outcomeChoices.map((choice) => (
                <Pressable key={choice} onPress={() => setOutcome(choice)} style={[styles.outcome, outcome === choice && styles.outcomeSelected]}>
                  <Text style={styles.outcomeText}>{choice}</Text>
                </Pressable>
              ))}
            </View>
            <Card style={styles.replyCard} variant="panel">
              <Text style={styles.replyLabel}>{outcome} reply</Text>
              <Text style={styles.replyText}>{sampleReply}</Text>
              <Text style={styles.replyReason}>Why this may work: it makes your intention explicit without pretending to know what the other person meant.</Text>
            </Card>
          </>
        ) : null}

        {step === 4 ? (
          <>
            <Text style={styles.title}>Your conversations stay intentional.</Text>
            <View style={styles.privacyStack}>
              <View style={styles.privacyRow}><Lock color={colors.olive} size={20} /><Text style={styles.privacyText}>Only messages you paste or share are processed.</Text></View>
              <View style={styles.privacyRow}><ShieldCheck color={colors.olive} size={20} /><Text style={styles.privacyText}>Nothing is read automatically.</Text></View>
              <View style={styles.privacyRow}><Check color={colors.olive} size={20} /><Text style={styles.privacyText}>No background monitoring.</Text></View>
            </View>
            <Text style={styles.finishTitle}>Ready to understand before replying?</Text>
          </>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        <Button disabled={step === 0 && !ambiguityChoice} onPress={next} size="lg">
          {step === TOTAL_STEPS - 1 ? 'Continue setup' : 'Continue'}
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.paper },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing[5], paddingTop: spacing[2] },
  progress: { flexDirection: 'row', gap: spacing[2] },
  dot: { width: 24, height: 4, borderRadius: radii.pill, backgroundColor: colors.border },
  dotActive: { backgroundColor: colors.oxblood },
  skip: { color: colors.ink55, fontFamily: fonts.sansMedium, fontSize: 13 },
  content: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: spacing[6], paddingVertical: spacing[6] },
  title: { color: colors.ink, fontFamily: fonts.serif, fontSize: 32, lineHeight: 38, textAlign: 'center', letterSpacing: -0.6, marginBottom: spacing[3] },
  body: { color: colors.ink72, fontFamily: fonts.sans, fontSize: 15, lineHeight: 22, textAlign: 'center', marginBottom: spacing[6] },
  messageCard: { paddingVertical: spacing[8], alignItems: 'center', marginVertical: spacing[5], ...shadows.md },
  message: { color: colors.ink, fontFamily: fonts.serif, fontSize: 42 },
  question: { color: colors.ink72, fontFamily: fonts.sansMedium, fontSize: 15, textAlign: 'center', marginBottom: spacing[4] },
  choiceStack: { gap: spacing[3] },
  choice: { minHeight: 54, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.paperSoft, paddingHorizontal: spacing[4], flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  choiceSelected: { borderColor: colors.oxblood, backgroundColor: colors.soft },
  choiceText: { color: colors.ink, fontFamily: fonts.sansMedium, fontSize: 15 },
  meaningStack: { gap: spacing[3], marginTop: spacing[4] },
  meaningRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], padding: spacing[4], borderRadius: radii.md, backgroundColor: colors.paperSoft },
  meaningText: { color: colors.ink, fontFamily: fonts.sansMedium, fontSize: 15 },
  flowStack: { marginTop: spacing[3] },
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
  privacyStack: { gap: spacing[4], marginVertical: spacing[7] },
  privacyRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing[3] },
  privacyText: { flex: 1, color: colors.ink72, fontFamily: fonts.sans, fontSize: 15, lineHeight: 22 },
  finishTitle: { color: colors.ink, fontFamily: fonts.serif, fontSize: 25, lineHeight: 31, textAlign: 'center', marginTop: spacing[5] },
  footer: { paddingHorizontal: spacing[6], paddingBottom: spacing[5], paddingTop: spacing[3] },
});
