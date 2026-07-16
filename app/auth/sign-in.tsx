import { router } from 'expo-router';
import { Check } from 'lucide-react-native';
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
import { migrateLocalRewritesToAccount } from '../../src/services/historyService';
import { getSupabaseClient, isSupabaseConfigured } from '../../src/services/supabase';
import { colors, radii, spacing } from '../../src/theme/tokens';
import { fonts } from '../../src/theme/typography';

const RESET_PASSWORD_REDIRECT = 'sentient://auth/reset-password';

type AuthMode = 'signIn' | 'signUp' | 'forgotPassword';

function navigateAfterAuth(): void {
  if (router.canGoBack()) {
    router.back();
    return;
  }
  router.replace('/(tabs)');
}

function isEmailNotConfirmedError(error: { message?: string } | null | undefined): boolean {
  return Boolean(error?.message?.toLowerCase().includes('email not confirmed'));
}

export default function SignInScreen() {
  const [mode, setMode] = useState<AuthMode>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [pendingConfirmation, setPendingConfirmation] = useState(false);
  const [signedInEmail, setSignedInEmail] = useState<string | null>(null);

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

    if (result.error) {
      setSubmitting(false);
      if (mode === 'signIn' && isEmailNotConfirmedError(result.error)) {
        setError(strings.auth.emailNotConfirmed);
      } else {
        setError(mode === 'signIn' ? strings.auth.signInError : strings.auth.signUpError);
      }
      return;
    }

    // With email confirmation on, sign-up succeeds but returns no session
    // until the user clicks the link in their inbox — don't navigate as if
    // they're signed in.
    if (mode === 'signUp' && !result.data.session) {
      setSubmitting(false);
      setPendingConfirmation(true);
      return;
    }

    try {
      await migrateLocalRewritesToAccount();
    } catch {
      // Migration failure shouldn't block sign-in; the local copy is left intact.
    }

    setSubmitting(false);
    // Show an explicit confirmation before navigating away — the screen we
    // return to (often onboarding) has no other sign-in indicator of its own.
    setSignedInEmail(result.data.user?.email ?? trimmedEmail);
  }, [email, mode, password]);

  const handleForgotPassword = useCallback(async () => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setError(strings.auth.configError);
      return;
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError(strings.auth.resetEmailRequired);
      return;
    }

    setSubmitting(true);
    setError(null);

    await supabase.auth.resetPasswordForEmail(trimmedEmail, {
      redirectTo: RESET_PASSWORD_REDIRECT,
    });

    // Show the same confirmation regardless of outcome so we don't reveal
    // whether an account exists for this email.
    setSubmitting(false);
    setResetSent(true);
  }, [email]);

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

  if (signedInEmail) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.configContainer}>
          <View style={styles.signedInBadge}>
            <Check color={colors.oxbloodFg} size={20} strokeWidth={2.5} />
          </View>
          <Text style={styles.configTitle}>{strings.auth.signedInTitle}</Text>
          <Text style={styles.configMessage}>{strings.auth.signedInBody(signedInEmail)}</Text>
          <Button onPress={navigateAfterAuth} size="lg" style={styles.submitButton}>
            {strings.auth.resetContinue}
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  if (mode === 'forgotPassword') {
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
            <Text style={styles.resetBody}>{strings.auth.resetBody}</Text>

            {resetSent ? (
              <Text style={styles.resetConfirmation}>{strings.auth.resetSentConfirmation}</Text>
            ) : (
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

                {error ? <Text style={styles.error}>{error}</Text> : null}

                <Button
                  disabled={submitting}
                  onPress={() => {
                    void handleForgotPassword();
                  }}
                  size="lg"
                  style={styles.submitButton}
                >
                  {submitting ? (
                    <ActivityIndicator color={colors.oxbloodFg} />
                  ) : (
                    strings.auth.resetSendButton
                  )}
                </Button>
              </View>
            )}

            <Button
              onPress={() => {
                setMode('signIn');
                setError(null);
                setResetSent(false);
              }}
              variant="text"
              style={styles.backToSignInButton}
            >
              {strings.auth.backToSignIn}
            </Button>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  if (pendingConfirmation) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.configContainer}>
          <Text style={styles.configTitle}>{strings.auth.confirmEmailTitle}</Text>
          <Text style={styles.configMessage}>{strings.auth.confirmEmailBody}</Text>
          <Button
            onPress={() => {
              setPendingConfirmation(false);
              setMode('signIn');
            }}
            size="lg"
            style={styles.submitButton}
          >
            {strings.auth.backToSignIn}
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
          <Text style={styles.title}>{strings.auth.title}</Text>
          <Text style={styles.syncBenefit}>{strings.auth.syncBenefit}</Text>

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

            {mode === 'signIn' ? (
              <Button
                onPress={() => {
                  setMode('forgotPassword');
                  setError(null);
                  setResetSent(false);
                }}
                variant="text"
                style={styles.forgotPasswordButton}
              >
                {strings.auth.forgotPassword}
              </Button>
            ) : null}

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
  signedInBadge: {
    alignSelf: 'center',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.olive,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[2],
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
    marginBottom: spacing[3],
  },
  syncBenefit: {
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 21,
    color: colors.ink72,
    textAlign: 'center',
    marginBottom: spacing[6],
  },
  resetBody: {
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 21,
    color: colors.ink72,
    textAlign: 'center',
    marginBottom: spacing[6],
  },
  resetConfirmation: {
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 21,
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
  forgotPasswordButton: {
    alignSelf: 'flex-end',
  },
  backToSignInButton: {
    alignSelf: 'center',
    marginTop: spacing[6],
  },
});
