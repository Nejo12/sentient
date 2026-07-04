import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';

import { isSetupComplete } from '../src/services/setupStorage';

export default function Index() {
  const [ready, setReady] = useState(false);
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    void isSetupComplete().then((value) => {
      setComplete(value);
      setReady(true);
    });
  }, []);

  if (!ready) {
    return null;
  }

  if (!complete) {
    return <Redirect href="/setup" />;
  }

  return <Redirect href="/(tabs)" />;
}
