import { Redirect, router } from 'expo-router';
import { useShareIntentContext } from 'expo-share-intent';
import { useEffect, useState } from 'react';

import { isSetupComplete } from '../src/services/setupStorage';

export default function Index() {
  const { hasShareIntent, isReady: shareIntentReady } = useShareIntentContext();
  const [ready, setReady] = useState(false);
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    if (!shareIntentReady || !hasShareIntent) {
      return;
    }

    router.replace('/(flow)/choose');
  }, [hasShareIntent, shareIntentReady]);

  useEffect(() => {
    void isSetupComplete().then((value) => {
      setComplete(value);
      setReady(true);
    });
  }, []);

  if (!ready) {
    return null;
  }

  if (hasShareIntent) {
    return null;
  }

  if (!complete) {
    return <Redirect href="/setup" />;
  }

  return <Redirect href="/(tabs)" />;
}
