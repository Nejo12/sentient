import { useRouter } from 'expo-router';
import { useShareIntentContext } from 'expo-share-intent';
import { useEffect } from 'react';

const CHOOSE_ROUTE = '/(flow)/choose' as const;

/** Navigate to choose once native share payload is available. */
export function ShareIntentNavigation() {
  const router = useRouter();
  const { hasShareIntent, isReady } = useShareIntentContext();

  useEffect(() => {
    if (isReady && hasShareIntent) {
      router.replace(CHOOSE_ROUTE);
    }
  }, [hasShareIntent, isReady, router]);

  return null;
}
