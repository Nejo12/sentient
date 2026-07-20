import { AlertTriangle, ChevronDown, ChevronUp, HelpCircle, Search } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { strings } from '../constants/strings';
import { colors, spacing } from '../theme/tokens';
import { fonts } from '../theme/typography';
import type { CommunicationAnalysis, InterpretationConfidence } from '../types/rewrite';
import { Card } from './Card';
import { Pill } from './Pill';

interface CommunicationAnalysisPanelProps {
  analysis: CommunicationAnalysis;
}

const confidenceLabels: Record<InterpretationConfidence, string> = {
  high: strings.analysis.confidenceHigh,
  medium: strings.analysis.confidenceMedium,
  low: strings.analysis.confidenceLow,
};

export function CommunicationAnalysisPanel({ analysis }: CommunicationAnalysisPanelProps) {
  const [deepOpen, setDeepOpen] = useState(false);
  const visibleMeanings = deepOpen ? analysis.possibleMeanings : analysis.possibleMeanings.slice(0, 2);

  return (
    <View style={styles.container}>
      <View style={styles.intro}>
        <Text style={styles.eyebrow}>{strings.analysis.eyebrow}</Text>
        <Text style={styles.title}>{strings.analysis.title}</Text>
        <Text style={styles.disclaimer}>{strings.analysis.disclaimer}</Text>
      </View>

      <Card style={styles.sectionCard} variant="panel">
        <View style={styles.sectionHeading}>
          <Search color={colors.clay} size={17} strokeWidth={2} />
          <Text style={styles.sectionTitle}>{strings.analysis.possibleMeanings}</Text>
        </View>

        <View style={styles.meaningsStack}>
          {visibleMeanings.map((meaning, index) => (
            <View key={`${meaning.title}-${index}`} style={styles.meaningItem}>
              <View style={styles.meaningHeader}>
                <Text style={styles.meaningTitle}>{meaning.title}</Text>
                <Pill variant={meaning.confidence === 'high' ? 'accent' : 'neutral'}>
                  {confidenceLabels[meaning.confidence]}
                </Pill>
              </View>
              <Text style={styles.body}>{meaning.explanation}</Text>
            </View>
          ))}
        </View>
      </Card>

      {deepOpen && analysis.whatWeCannotKnow.length ? (
        <Card style={styles.sectionCard} variant="panel">
          <View style={styles.sectionHeading}>
            <HelpCircle color={colors.olive} size={17} strokeWidth={2} />
            <Text style={styles.sectionTitle}>{strings.analysis.cannotKnow}</Text>
          </View>
          {analysis.whatWeCannotKnow.map((item, index) => (
            <View key={`${item}-${index}`} style={styles.bulletRow}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.body}>{item}</Text>
            </View>
          ))}
        </Card>
      ) : null}

      {deepOpen && analysis.watchOutFor.length ? (
        <Card style={styles.warningCard} variant="panel">
          <View style={styles.sectionHeading}>
            <AlertTriangle color={colors.destructive} size={17} strokeWidth={2} />
            <Text style={styles.sectionTitle}>{strings.analysis.watchOutFor}</Text>
          </View>
          {analysis.watchOutFor.map((item, index) => (
            <View key={`${item}-${index}`} style={styles.bulletRow}>
              <Text style={styles.warningBullet}>•</Text>
              <Text style={styles.body}>{item}</Text>
            </View>
          ))}
        </Card>
      ) : null}

      {(analysis.possibleMeanings.length > 2 || analysis.whatWeCannotKnow.length > 0 || analysis.watchOutFor.length > 0) ? (
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: deepOpen }}
          onPress={() => setDeepOpen((current) => !current)}
          style={({ pressed }) => [styles.disclosureButton, pressed && styles.pressed]}
        >
          <Text style={styles.disclosureText}>{deepOpen ? 'Show less' : 'Tell me more'}</Text>
          {deepOpen ? (
            <ChevronUp color={colors.oxblood} size={17} strokeWidth={2} />
          ) : (
            <ChevronDown color={colors.oxblood} size={17} strokeWidth={2} />
          )}
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing[3],
  },
  intro: {
    gap: spacing[1],
  },
  eyebrow: {
    color: colors.clay,
    fontFamily: fonts.sansSemiBold,
    fontWeight: '600',
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.24,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.ink,
    fontFamily: fonts.serif,
    fontSize: 24,
    lineHeight: 30,
  },
  disclaimer: {
    color: colors.ink55,
    fontFamily: fonts.sans,
    fontSize: 12,
    lineHeight: 18,
  },
  sectionCard: {
    gap: spacing[3],
    padding: spacing[4],
  },
  warningCard: {
    gap: spacing[3],
    padding: spacing[4],
    borderColor: 'rgba(145, 53, 45, 0.22)',
    backgroundColor: 'rgba(145, 53, 45, 0.035)',
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  sectionTitle: {
    color: colors.ink,
    fontFamily: fonts.sansSemiBold,
    fontWeight: '600',
    fontSize: 14,
    lineHeight: 19,
  },
  meaningsStack: {
    gap: spacing[3],
  },
  meaningItem: {
    gap: spacing[1],
    paddingBottom: spacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  meaningHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing[2],
  },
  meaningTitle: {
    flex: 1,
    color: colors.ink,
    fontFamily: fonts.sansSemiBold,
    fontWeight: '600',
    fontSize: 14,
    lineHeight: 20,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[2],
  },
  bullet: {
    color: colors.olive,
    fontSize: 16,
    lineHeight: 21,
  },
  warningBullet: {
    color: colors.destructive,
    fontSize: 16,
    lineHeight: 21,
  },
  body: {
    flex: 1,
    color: colors.ink72,
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 20,
  },
  disclosureButton: {
    minHeight: 40,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[1],
    paddingHorizontal: spacing[3],
  },
  disclosureText: {
    color: colors.oxblood,
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
    lineHeight: 18,
  },
  pressed: {
    opacity: 0.72,
  },
});
