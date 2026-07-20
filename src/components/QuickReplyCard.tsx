import { ChevronDown, ChevronUp, Copy, Send } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing } from '../theme/tokens';
import { fonts } from '../theme/typography';
import type { RewriteOption } from '../types/rewrite';
import { Button } from './Button';
import { Card } from './Card';
import { Pill } from './Pill';

interface QuickReplyCardProps {
  option: RewriteOption;
  caution?: string | null;
  onCopy: () => void;
  onSendBack: () => void;
}

export function QuickReplyCard({ option, caution, onCopy, onSendBack }: QuickReplyCardProps) {
  const [whyOpen, setWhyOpen] = useState(false);

  return (
    <Card style={styles.card} variant="panel">
      <View style={styles.headingRow}>
        <View style={styles.headingCopy}>
          <Text style={styles.eyebrow}>Suggested reply</Text>
          <Text style={styles.label}>{option.label}</Text>
        </View>
        <Pill variant="success">Recommended</Pill>
      </View>

      <Text style={styles.body}>{option.text}</Text>

      {caution ? (
        <View style={styles.cautionPanel}>
          <Text style={styles.cautionLabel}>Possible misunderstanding</Text>
          <Text style={styles.cautionText}>{caution}</Text>
        </View>
      ) : null}

      <View style={styles.actions}>
        <Button
          icon={<Copy color={colors.ink72} size={14} strokeWidth={1.9} />}
          onPress={onCopy}
          size="sm"
          style={styles.actionButton}
          variant="secondary"
        >
          Copy
        </Button>
        <Button
          icon={<Send color={colors.oxbloodFg} size={14} strokeWidth={1.9} />}
          onPress={onSendBack}
          size="sm"
          style={styles.actionButton}
          variant="primary"
        >
          Use this reply
        </Button>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: whyOpen }}
        onPress={() => setWhyOpen((current) => !current)}
        style={({ pressed }) => [styles.whyButton, pressed && styles.pressed]}
      >
        <Text style={styles.whyButtonText}>{whyOpen ? 'Hide why' : 'Why this reply?'}</Text>
        {whyOpen ? (
          <ChevronUp color={colors.oxblood} size={17} strokeWidth={2} />
        ) : (
          <ChevronDown color={colors.oxblood} size={17} strokeWidth={2} />
        )}
      </Pressable>

      {whyOpen ? (
        <View style={styles.whyPanel}>
          <Text style={styles.whyText}>{option.rationale}</Text>
          <View style={styles.scoreRow}>
            <Text style={styles.scoreLabel}>Likelihood of being understood</Text>
            <Text style={styles.scoreValue}>{option.understandingScore}%</Text>
          </View>
          <View style={styles.meterTrack}>
            <View
              style={[
                styles.meterFill,
                { width: `${Math.max(0, Math.min(100, option.understandingScore))}%` },
              ]}
            />
          </View>
          {option.risks.length ? (
            <View style={styles.risks}>
              <Text style={styles.riskLabel}>Trade-offs</Text>
              {option.risks.map((risk) => (
                <Text key={risk} style={styles.riskText}>• {risk}</Text>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing[3],
    padding: spacing[4],
  },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing[3],
  },
  headingCopy: {
    flex: 1,
    gap: 2,
  },
  eyebrow: {
    color: colors.clay,
    fontFamily: fonts.sansSemiBold,
    fontSize: 11,
    lineHeight: 15,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  label: {
    color: colors.ink,
    fontFamily: fonts.sansSemiBold,
    fontSize: 15,
    lineHeight: 20,
  },
  body: {
    color: colors.ink,
    fontFamily: fonts.sansMedium,
    fontSize: 17,
    lineHeight: 25,
  },
  cautionPanel: {
    gap: spacing[1],
    borderRadius: radii.md,
    backgroundColor: colors.oliveSoft,
    padding: spacing[3],
  },
  cautionLabel: {
    color: colors.olive,
    fontFamily: fonts.sansSemiBold,
    fontSize: 12,
    lineHeight: 16,
  },
  cautionText: {
    color: colors.ink72,
    fontFamily: fonts.sans,
    fontSize: 12.5,
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  actionButton: {
    flex: 1,
  },
  whyButton: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[1],
  },
  whyButtonText: {
    color: colors.oxblood,
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
    lineHeight: 18,
  },
  pressed: {
    opacity: 0.72,
  },
  whyPanel: {
    gap: spacing[2],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: spacing[3],
  },
  whyText: {
    color: colors.ink72,
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 19,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing[2],
  },
  scoreLabel: {
    flex: 1,
    color: colors.ink55,
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    lineHeight: 16,
  },
  scoreValue: {
    color: colors.olive,
    fontFamily: fonts.sansSemiBold,
    fontSize: 12,
    lineHeight: 16,
  },
  meterTrack: {
    height: 6,
    overflow: 'hidden',
    borderRadius: radii.pill,
    backgroundColor: colors.border,
  },
  meterFill: {
    height: '100%',
    borderRadius: radii.pill,
    backgroundColor: colors.olive,
  },
  risks: {
    gap: 2,
  },
  riskLabel: {
    color: colors.ink55,
    fontFamily: fonts.sansSemiBold,
    fontSize: 12,
    lineHeight: 16,
  },
  riskText: {
    color: colors.ink55,
    fontFamily: fonts.sans,
    fontSize: 12,
    lineHeight: 17,
  },
});
