import { Copy, Send } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { strings } from '../constants/strings';
import { colors, radii, spacing } from '../theme/tokens';
import { fonts } from '../theme/typography';
import type { RewriteOption } from '../types/rewrite';
import { Button } from './Button';
import { Card } from './Card';
import { Pill } from './Pill';

interface ResultCardProps {
  option: RewriteOption;
  onCopy: () => void;
  onSendBack: () => void;
}

export function ResultCard({ option, onCopy, onSendBack }: ResultCardProps) {
  return (
    <Card style={styles.card} variant="panel">
      <Text style={styles.label}>{option.label}</Text>

      <View style={styles.tagsRow}>
        <Pill variant="accent">{option.tag}</Pill>
        {option.recommended ? (
          <Pill variant="success">{strings.compare.recommended}</Pill>
        ) : null}
      </View>

      <Text style={styles.body}>{option.text}</Text>

      <View style={styles.insightPanel}>
        <Text style={styles.insightEyebrow}>Why this may work</Text>
        <Text style={styles.insightText}>{option.rationale}</Text>

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
          <View style={styles.riskBlock}>
            <Text style={styles.riskLabel}>Trade-offs</Text>
            {option.risks.map((risk) => (
              <Text key={risk} style={styles.riskText}>• {risk}</Text>
            ))}
          </View>
        ) : null}
      </View>

      <View style={styles.actions}>
        <Button
          icon={<Copy color={colors.ink72} size={14} strokeWidth={1.9} />}
          onPress={onCopy}
          size="sm"
          style={styles.actionButton}
          variant="secondary"
        >
          {strings.compare.copy}
        </Button>
        <Button
          icon={<Send color={colors.oxbloodFg} size={14} strokeWidth={1.9} />}
          onPress={onSendBack}
          size="sm"
          style={styles.actionButton}
          variant="primary"
        >
          {strings.compare.sendBack}
        </Button>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing[3],
    padding: spacing[4],
  },
  label: {
    color: colors.ink,
    fontFamily: fonts.sansSemiBold,
    fontWeight: '600',
    fontSize: 15,
    lineHeight: 20,
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  body: {
    color: colors.ink72,
    fontFamily: fonts.sans,
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 22,
  },
  insightPanel: {
    gap: spacing[2],
    borderRadius: radii.md,
    backgroundColor: colors.paperSoft,
    padding: spacing[3],
  },
  insightEyebrow: {
    color: colors.clay,
    fontFamily: fonts.sansSemiBold,
    fontWeight: '600',
    fontSize: 12,
    lineHeight: 16,
  },
  insightText: {
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
    fontWeight: '600',
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
  riskBlock: {
    gap: 2,
  },
  riskLabel: {
    color: colors.ink55,
    fontFamily: fonts.sansSemiBold,
    fontWeight: '600',
    fontSize: 12,
    lineHeight: 16,
  },
  riskText: {
    color: colors.ink55,
    fontFamily: fonts.sans,
    fontSize: 12,
    lineHeight: 17,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  actionButton: {
    flex: 1,
  },
});
