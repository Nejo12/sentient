import { useLinkingURL } from 'expo-linking';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../../src/components/Button';
import { Input } from '../../src/components/Input';
import { strings } from '../../src/constants/strings';
import { getSupabaseClient } from '../../src/services/supabase';
import { colors, spacing } from '../../src/theme/tokens';
import { fonts } from '../../src/theme/typography';

type SessionState = 'pending' | 'ready' | 'invalid';

function parseRecoveryTokens(
  url: string | null | undefined,
): { accessToken: string; refreshToken: string } | null {
  if (!url) {
    return null;
  }

  const hashIndex = url.indexOf('#');
  if (hashIndex === -1) {
    return null;
  }

  const params = new URLSearchParams(url.slice(hashIndex + 1));
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  const type = params.get('type');

  if (!accessToken || !refreshToken || type !== 'recovery') {
    return null;
  }

  return { accessToken, refreshToken };
}

export default function ResetPasswordScreen() {
  const url = useLinkingURL();
  const tokens = useMemo(() => parseRecoveryTokens(url), [url]);

  const [sessionState, setSessionState] = useState<SessionState>('pending');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!tokens) {
      return;
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      Promise.resolve().then(() => setSessionState('invalid'));
      return;
    }

    supabase.auth
      .setSession({ access_token: tokens.accessToken, refresh_token: tokens.refreshToken })
      .then(({ error: sessionError }) => {
        setSessionState(sessionError ? 'invalid' : 'ready');
      });
  }, [tokens]);

  const handleSubmit = useCallback(async () => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setError(strings.auth.configError);
      return;
    }

    if (password.length < 8) {
      setError(strings.auth.resetPasswordTooShort);
      return;
    }

    if (password !== confirmPassword) {
      setError(strings.auth.resetPasswordMismatch);
      return;
    }

    setSubmitting(true);
    setError(null);

    const { error: updateError } = await supabase.auth.updateUser({ password });

    setSubmitting(false);

    if (updateError) {
      setError(strings.auth.resetPasswordError);
      return;
    }

    setDone(true);
  }, [confirmPassword, password]);

  const handleContinue = useCallback(() => {
    router.replace('/(tabs)');
  }, []);

  if (!tokens || sessionState === 'invalid') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <Text style={styles.title}>{strings.auth.resetTitle}</Text>
          <Text style={styles.body}>{strings.auth.resetLinkInvalid}</Text>
          <Button onPress={() => router.replace('/auth/sign-in')} size="lg" style={styles.button}>
            {strings.auth.backToSignIn}
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  if (sessionState === 'pending') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <ActivityIndicator color={colors.oxblood} />
        </View>
      </SafeAreaView>
    );
  }

  if (done) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <Text style={styles.title}>{strings.auth.resetTitle}</Text>
          <Text style={styles.body}>{strings.auth.resetPasswordSuccess}</Text>
          <Button onPress={handleContinue} size="lg" style={styles.button}>
            {strings.auth.resetContinue}
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>{strings.auth.resetTitle}</Text>
          <Text style={styles.body}>{strings.auth.resetPasswordBody}</Text>

          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>{strings.auth.resetNewPasswordLabel}</Text>
              <Input
                autoCapitalize="none"
                autoComplete="new-password"
                autoCorrect={false}
                onChangeText={setPassword}
                secureTextEntry
                textContentType="newPassword"
                value={password}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>{strings.auth.resetConfirmPasswordLabel}</Text>
              <Input
                autoCapitalize="none"
                autoComplete="new-password"
                autoCorrect={false}
                onChangeText={setConfirmPassword}
                secureTextEntry
                textContentType="newPassword"
                value={confirmPassword}
              />
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Button
              disabled={submitting}
              onPress={() => {
                void handleSubmit();
              }}
              size="lg"
              style={styles.button}
            >
              {submitting ? (
                <ActivityIndicator color={colors.oxbloodFg} />
              ) : (
                strings.auth.resetPasswordSubmit
              )}
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing[6],
    paddingTop: spacing[6],
    paddingBottom: spacing[8],
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing[6],
    gap: spacing[4],
  },
  title: {
    fontFamily: fonts.sansSemiBold,
    fontWeight: '600',
    fontSize: 22,
    lineHeight: 28,
    color: colors.ink,
    textAlign: 'center',
    marginBottom: spacing[3],
  },
  body: {
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 21,
    color: colors.ink72,
    textAlign: 'center',
    marginBottom: spacing[6],
  },
  form: {
    gap: spacing[4],
  },
  field: {
    gap: spacing[2],
  },
  label: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
    color: colors.ink72,
  },
  error: {
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 18,
    color: colors.oxblood,
  },
  button: {
    alignSelf: 'stretch',
    marginTop: spacing[2],
  },
});
