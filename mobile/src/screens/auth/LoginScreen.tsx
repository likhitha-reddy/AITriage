import React, {useState} from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';

import {Button} from '../../components/Button';
import {authService} from '../../services/authService';
import {useAuthStore} from '../../store/authStore';
import {colors} from '../../theme/colors';
import {spacing} from '../../theme/spacing';
import {typography} from '../../theme/typography';
import type {AuthStackParamList} from '../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export const LoginScreen = ({navigation}: Props) => {
  const setSession = useAuthStore(state => state.setSession);
  const [email, setEmail] = useState('avery@aitriage.app');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing details', 'Please enter both email and password.');
      return;
    }

    try {
      setLoading(true);
      const response = await authService.login(email.trim(), password);
      setSession(response.user, response.token);
    } catch (error) {
      Alert.alert('Unable to sign in', error instanceof Error ? error.message : 'Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.select({ios: 'padding', default: undefined})}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.hero}>
            <Text style={styles.eyebrow}>AI-POWERED CARE</Text>
            <Text style={styles.title}>Welcome back to AITriage</Text>
            <Text style={styles.subtitle}>
              Start symptom triage, book care, and manage prescriptions in one secure experience.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              autoCapitalize="none"
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

            <Button title="Sign In" onPress={handleLogin} loading={loading} />
            <Button title="Create Account" onPress={() => navigation.navigate('Register')} variant="secondary" />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
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
});
