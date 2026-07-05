import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../../src/components/Button';
import { Input } from '../../src/components/Input';
import { strings } from '../../src/constants/strings';
import { getSupabaseClient, isSupabaseConfigured } from '../../src/services/supabase';
import { colors, radii, spacing } from '../../src/theme/tokens';
import { fonts } from '../../src/theme/typography';

type AuthMode = 'signIn' | 'signUp';

function navigateAfterAuth(): void {
  if (router.canGoBack()) {
    router.back();
    return;
  }
  router.replace('/(tabs)');
}

export default function SignInScreen() {
  const [mode, setMode] = useState<AuthMode>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const configured = isSupabaseConfigured();

  const handleSubmit = useCallback(async () => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setError(strings.auth.configError);
      return;
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError(
        mode === 'signIn' ? strings.auth.signInError : strings.auth.signUpError,
      );
      return;
    }

    setSubmitting(true);
    setError(null);

    const result =
      mode === 'signIn'
        ? await supabase.auth.signInWithPassword({
            email: trimmedEmail,
            password,
          })
        : await supabase.auth.signUp({
            email: trimmedEmail,
            password,
          });

    setSubmitting(false);

    if (result.error) {
      setError(mode === 'signIn' ? strings.auth.signInError : strings.auth.signUpError);
      return;
    }

    navigateAfterAuth();
  }, [email, mode, password]);

  if (!configured) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.configContainer}>
          <Text style={styles.configTitle}>{strings.auth.title}</Text>
          <Text style={styles.configMessage}>{strings.auth.configError}</Text>
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
          <Text style={styles.title}>{strings.auth.title}</Text>

          <View style={styles.tabRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: mode === 'signIn' }}
              onPress={() => {
                setMode('signIn');
                setError(null);
              }}
              style={[styles.tab, mode === 'signIn' && styles.tabActive]}
            >
              <Text style={[styles.tabLabel, mode === 'signIn' && styles.tabLabelActive]}>
                {strings.auth.signInTab}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: mode === 'signUp' }}
              onPress={() => {
                setMode('signUp');
                setError(null);
              }}
              style={[styles.tab, mode === 'signUp' && styles.tabActive]}
            >
              <Text style={[styles.tabLabel, mode === 'signUp' && styles.tabLabelActive]}>
                {strings.auth.signUpTab}
              </Text>
            </Pressable>
          </View>

          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>{strings.auth.emailLabel}</Text>
              <Input
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect={false}
                keyboardType="email-address"
                onChangeText={setEmail}
                textContentType="emailAddress"
                value={email}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>{strings.auth.passwordLabel}</Text>
              <Input
                autoCapitalize="none"
                autoComplete={mode === 'signIn' ? 'password' : 'new-password'}
                autoCorrect={false}
                onChangeText={setPassword}
                secureTextEntry
                textContentType={mode === 'signIn' ? 'password' : 'newPassword'}
                value={password}
              />
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Button
              disabled={submitting}
              onPress={() => {
                void handleSubmit();
              }}
              size="lg"
              style={styles.submitButton}
            >
              {submitting ? (
                <ActivityIndicator color={colors.oxbloodFg} />
              ) : mode === 'signIn' ? (
                strings.auth.signInButton
              ) : (
                strings.auth.signUpButton
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
  configContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing[6],
    gap: spacing[3],
  },
  configTitle: {
    fontFamily: fonts.serif,
    fontSize: 24,
    lineHeight: 28,
    color: colors.ink,
    textAlign: 'center',
  },
  configMessage: {
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 21,
    color: colors.ink72,
    textAlign: 'center',
  },
  title: {
    fontFamily: fonts.serif,
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: -0.56,
    color: colors.ink,
    textAlign: 'center',
    marginBottom: spacing[6],
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: colors.paperSoft,
    borderRadius: radii.pill,
    padding: 4,
    marginBottom: spacing[6],
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[2],
    borderRadius: radii.pill,
  },
  tabActive: {
    backgroundColor: colors.paperStrong,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  tabLabel: {
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    color: colors.ink55,
  },
  tabLabelActive: {
    color: colors.ink,
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
  submitButton: {
    alignSelf: 'stretch',
    marginTop: spacing[2],
  },
});
