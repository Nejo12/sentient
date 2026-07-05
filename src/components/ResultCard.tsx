import { Copy, Send } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { strings } from '../constants/strings';
import { colors, spacing } from '../theme/tokens';
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
  actions: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  actionButton: {
    flex: 1,
  },
});
