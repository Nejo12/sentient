import { router, useFocusEffect } from 'expo-router';
import { ChevronDown, ChevronUp, Search, Settings } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Input } from '../../src/components/Input';
import { Pill } from '../../src/components/Pill';
import { strings } from '../../src/constants/strings';
import { UNDERSTANDING_OPTIONS } from '../../src/constants/understanding';
import {
  formatRewriteTime,
  getRewriteSectionLabel,
  getRewriteTitle,
  listRewrites,
} from '../../src/services/historyService';
import { colors, radii, spacing } from '../../src/theme/tokens';
import { fonts } from '../../src/theme/typography';
import type { RewriteRecord } from '../../src/types/history';

const AVATAR_PALETTES = [
  { bg: '#8B5E4A', fg: colors.oxbloodFg },
  { bg: '#B8956C', fg: colors.oxbloodFg },
  { bg: '#5C6B4F', fg: colors.oxbloodFg },
  { bg: '#7D6B8A', fg: colors.oxbloodFg },
  { bg: '#6B7D8C', fg: colors.oxbloodFg },
] as const;

type HistorySection = {
  title: string;
  data: RewriteRecord[];
};

function avatarPaletteForName(name: string): (typeof AVATAR_PALETTES)[number] {
  const code = name.trim().charCodeAt(0) || 0;
  return AVATAR_PALETTES[code % AVATAR_PALETTES.length];
}

function getPillLabel(record: RewriteRecord): string {
  if (record.intent === 'missing') {
    return strings.history.perspectivePill;
  }

  return (
    UNDERSTANDING_OPTIONS.find((option) => option.key === record.understanding)?.label ??
    'Your reply'
  );
}

function matchesSearch(record: RewriteRecord, query: string): boolean {
  const haystack = [
    record.contactName,
    record.sourceApp,
    record.snippet,
    record.fullText,
    getRewriteTitle(record),
    getPillLabel(record),
  ]
    .join(' ')
    .toLowerCase();

  return haystack.includes(query);
}

function groupRewrites(records: RewriteRecord[]): HistorySection[] {
  const sections = new Map<string, RewriteRecord[]>();

  for (const record of records) {
    const title = getRewriteSectionLabel(record.createdAt);
    const existing = sections.get(title) ?? [];
    existing.push(record);
    sections.set(title, existing);
  }

  return Array.from(sections.entries()).map(([title, data]) => ({ title, data }));
}

function HistoryCard({ record }: { record: RewriteRecord }) {
  const [expanded, setExpanded] = useState(false);
  const palette = avatarPaletteForName(record.contactName || record.sourceApp || 'R');
  const initial = (record.contactName.trim().charAt(0) || record.sourceApp.trim().charAt(0) || 'R').toUpperCase();

  return (
    <Pressable
      accessibilityHint={expanded ? strings.history.collapseHint : strings.history.expandHint}
      accessibilityLabel={`${getRewriteTitle(record)}. ${getPillLabel(record)}. ${record.fullText}`}
      accessibilityRole="button"
      accessibilityState={{ expanded }}
      onPress={() => setExpanded((current) => !current)}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <View style={[styles.avatar, { backgroundColor: palette.bg }]}> 
        <Text style={[styles.avatarInitial, { color: palette.fg }]}>{initial}</Text>
      </View>

      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <View style={styles.titleRow}>
            <Text numberOfLines={1} style={styles.cardTitle}>
              {getRewriteTitle(record)}
            </Text>
            <Pill variant="accent">{getPillLabel(record)}</Pill>
          </View>
          <Text style={styles.time}>{formatRewriteTime(record.createdAt)}</Text>
        </View>

        <Text numberOfLines={expanded ? undefined : 2} style={styles.snippet}>
          {record.fullText}
        </Text>

        <View style={styles.expandRow}>
          <Text style={styles.expandLabel}>
            {expanded ? strings.history.collapseHint : strings.history.expandHint}
          </Text>
          {expanded ? (
            <ChevronUp color={colors.oxblood} size={16} strokeWidth={2} />
          ) : (
            <ChevronDown color={colors.oxblood} size={16} strokeWidth={2} />
          )}
        </View>
      </View>
    </Pressable>
  );
}

export default function HistoryScreen() {
  const [records, setRecords] = useState<RewriteRecord[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    try {
      const nextRecords = await listRewrites();
      setRecords(nextRecords);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadHistory();
    }, [loadHistory]),
  );

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return records;
    }

    return records.filter((record) => matchesSearch(record, query));
  }, [records, search]);

  const sections = useMemo(() => groupRewrites(filteredRecords), [filteredRecords]);
  const emptyMessage = search.trim()
    ? strings.history.emptySearch
    : strings.history.empty;

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>{strings.brand.name}</Text>
          <Text style={styles.title}>{strings.history.title}</Text>
        </View>
        <Pressable
          accessibilityLabel="Open settings"
          accessibilityRole="button"
          onPress={() => router.push('/(tabs)/you')}
          style={styles.settingsButton}
        >
          <Settings color={colors.ink55} size={18} strokeWidth={1.9} />
        </Pressable>
      </View>

      <View style={styles.searchWrap}>
        <Search color={colors.ink40} size={16} strokeWidth={1.9} style={styles.searchIcon} />
        <Input
          accessibilityLabel="Search rewrites"
          onChangeText={setSearch}
          placeholder={strings.history.searchPlaceholder}
          style={styles.searchInput}
          value={search}
        />
      </View>

      {loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator color={colors.oxblood} />
        </View>
      ) : (
        <SectionList
          contentContainerStyle={[
            styles.listContent,
            filteredRecords.length === 0 && styles.listContentEmpty,
          ]}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={<Text style={styles.empty}>{emptyMessage}</Text>}
          renderItem={({ item }) => <HistoryCard record={item} />}
          renderSectionHeader={({ section: { title } }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>{title}</Text>
              <View style={styles.sectionRule} />
            </View>
          )}
          sections={sections}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: spacing[4],
    gap: spacing[3],
  },
  headerCopy: {
    flex: 1,
    gap: spacing[1],
  },
  eyebrow: {
    color: colors.clay,
    fontFamily: fonts.sansSemiBold,
    fontWeight: '600',
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.24,
  },
  title: {
    color: colors.ink,
    fontFamily: fonts.sansSemiBold,
    fontWeight: '600',
    fontSize: 22,
    lineHeight: 28,
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
  },
  searchWrap: {
    position: 'relative',
    paddingHorizontal: 18,
    paddingTop: spacing[4],
    paddingBottom: spacing[2],
  },
  searchIcon: {
    position: 'absolute',
    left: 32,
    top: 30,
    zIndex: 1,
  },
  searchInput: {
    minHeight: 48,
    paddingLeft: 42,
  },
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: 18,
    paddingBottom: spacing[6],
    gap: spacing[2],
  },
  listContentEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    marginTop: spacing[3],
    marginBottom: spacing[2],
  },
  sectionLabel: {
    color: colors.ink40,
    fontFamily: fonts.sansMedium,
    fontWeight: '500',
    fontSize: 11,
    lineHeight: 16,
  },
  sectionRule: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.paperStrong,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[4],
    marginBottom: spacing[2],
  },
  cardPressed: {
    opacity: 0.86,
    transform: [{ scale: 0.995 }],
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontFamily: fonts.sansSemiBold,
    fontWeight: '600',
    fontSize: 14,
    lineHeight: 18,
  },
  cardContent: {
    flex: 1,
    gap: spacing[2],
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing[2],
  },
  titleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  cardTitle: {
    flexShrink: 1,
    color: colors.ink,
    fontFamily: fonts.sansSemiBold,
    fontWeight: '600',
    fontSize: 14,
    lineHeight: 20,
  },
  time: {
    color: colors.ink40,
    fontFamily: fonts.sans,
    fontWeight: '400',
    fontSize: 11,
    lineHeight: 16,
  },
  snippet: {
    color: colors.ink55,
    fontFamily: fonts.sans,
    fontWeight: '400',
    fontSize: 13,
    lineHeight: 20,
  },
  expandRow: {
    minHeight: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[2],
  },
  expandLabel: {
    color: colors.oxblood,
    fontFamily: fonts.sansMedium,
    fontWeight: '500',
    fontSize: 11,
    lineHeight: 16,
  },
  empty: {
    color: colors.ink55,
    fontFamily: fonts.sans,
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    paddingHorizontal: spacing[6],
  },
});