import { useRouter } from 'expo-router';
import { useShareIntentContext } from 'expo-share-intent';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { colors } from '../src/theme/tokens';

/** Wait for native share payload, then open the choose flow. */
export default function ShareIntentScreen() {
  const router = useRouter();
  const { hasShareIntent, isReady } = useShareIntentContext();

  useEffect(() => {
    if (isReady && hasShareIntent) {
      router.replace('/(flow)/choose');
    }
  }, [hasShareIntent, isReady, router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator color={colors.clay} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.paper,
  },
});
