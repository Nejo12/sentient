import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandMark } from '../../src/components/BrandMark';
import { Button } from '../../src/components/Button';
import { strings } from '../../src/constants/strings';
import { useSessionStore } from '../../src/store/sessionStore';
import { colors, spacing } from '../../src/theme/tokens';
import { fonts } from '../../src/theme/typography';

export default function HomeScreen() {
  const openChoose = () => {
    // Start from a clean slate so a leftover message/draft from a previous
    // session doesn't appear to pre-fill this manual-entry flow.
    useSessionStore.getState().reset();
    router.push('/(flow)/choose');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.eyebrow}>{strings.home.eyebrow}</Text>
        <BrandMark size={66} style={styles.mark} />
        <Text style={styles.title}>{strings.home.title}</Text>
        <Text style={styles.body}>{strings.home.body}</Text>
        <View style={styles.cta}>
          <Button variant="primary" size="lg" onPress={openChoose}>
            {strings.home.cta}
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing[6],
    paddingTop: spacing[8],
    paddingBottom: spacing[6],
    alignItems: 'center',
  },
  eyebrow: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 12,
    color: colors.clay,
    letterSpacing: 0.24,
    textTransform: 'uppercase',
    marginBottom: spacing[5],
  },
  mark: {
    marginBottom: spacing[5],
  },
  title: {
    fontFamily: fonts.sansSemiBold,
    fontWeight: '600',
    fontSize: 22,
    color: colors.ink,
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: spacing[4],
    maxWidth: 280,
  },
  body: {
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.ink72,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 300,
    marginBottom: spacing[8],
  },
  cta: {
    width: '100%',
    maxWidth: 320,
  },
});
