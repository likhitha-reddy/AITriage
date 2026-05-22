import React, {useMemo, useState} from 'react';
import {StyleSheet, Text, TextInput, View} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';

import {Button} from '../../components/Button';
import {KeyboardScreen} from '../../components/KeyboardScreen';
import {ToastProvider, useToast} from '../../components/ToastProvider';
import {authService} from '../../services/authService';
import {useAuthStore} from '../../store/authStore';
import {colors} from '../../theme/colors';
import {spacing} from '../../theme/spacing';
import {typography} from '../../theme/typography';
import type {AuthStackParamList} from '../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const LoginScreen = ({navigation}: Props) => {
  const {showToast} = useToast();
  const setSession = useAuthStore(state => state.setSession);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const validationMessage = useMemo(() => {
    if (!email.trim() || !password.trim()) {
      return 'Enter your email and password to continue.';
    }
    if (!emailPattern.test(email.trim())) {
      return 'Use a valid email address.';
    }
    if (password.trim().length < 8) {
      return 'Password must be at least 8 characters.';
    }
    return '';
  }, [email, password]);

  const handleLogin = async () => {
    if (validationMessage) {
      showToast(validationMessage, 'error');
      return;
    }

    try {
      setLoading(true);
      const response = await authService.login(email.trim().toLowerCase(), password.trim());
      setSession(response.user, response.accessToken);
      showToast('Signed in successfully.', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to sign in.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardScreen contentContainerStyle={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>AI-POWERED CARE</Text>
        <Text style={styles.title}>Welcome back to AITriage</Text>
        <Text style={styles.subtitle}>
          Sign in to review symptom triage, book consultations, and manage follow-up care.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          placeholderTextColor={colors.textSecondary}
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          secureTextEntry
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="Enter your password"
          placeholderTextColor={colors.textSecondary}
        />

        {validationMessage ? <Text style={styles.helper}>{validationMessage}</Text> : null}

        <Button title="Sign In" onPress={handleLogin} loading={loading} />
        <Button title="Create Account" onPress={() => navigation.navigate('Register')} variant="secondary" />
      </View>
    </KeyboardScreen>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.xl,
  },
  hero: {
    gap: spacing.sm,
  },
  eyebrow: {
    color: colors.primary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    letterSpacing: 1,
  },
  title: {
    color: colors.text,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: typography.sizes.md,
    lineHeight: 24,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: spacing.lg,
    gap: spacing.md,
  },
  label: {
    color: colors.text,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  input: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.text,
  },
  helper: {
    color: colors.danger,
    fontSize: typography.sizes.sm,
  },
});
