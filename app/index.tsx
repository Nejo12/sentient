import { Redirect, router } from 'expo-router';
import { useShareIntentContext } from 'expo-share-intent';
import { useEffect, useState } from 'react';

import { isOnboardingComplete } from '../src/services/onboardingStorage';
import { isSetupComplete } from '../src/services/setupStorage';

export default function Index() {
  const { hasShareIntent, isReady: shareIntentReady } = useShareIntentContext();
  const [ready, setReady] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [setupComplete, setSetupCompleteState] = useState(false);

  useEffect(() => {
    if (!shareIntentReady || !hasShareIntent) {
      return;
    }

    router.replace('/(flow)/choose');
  }, [hasShareIntent, shareIntentReady]);

  useEffect(() => {
    void Promise.all([isOnboardingComplete(), isSetupComplete()]).then(
      ([onboardingDone, setupDone]) => {
        setOnboardingComplete(onboardingDone);
        setSetupCompleteState(setupDone);
        setReady(true);
      },
    );
  }, []);

  if (!ready) {
    return null;
  }

  if (hasShareIntent) {
    return null;
  }

  if (!onboardingComplete) {
    return <Redirect href="/onboarding" />;
  }

  if (!setupComplete) {
    return <Redirect href="/setup" />;
  }

  return <Redirect href="/(tabs)" />;
}
